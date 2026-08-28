import { aggregate, type Aggregate, type CostSettings, type DayMetrics, n } from "./calc";
import { linesOf, metricsOf, snapshotToSettings, type DailyRow } from "./db";
import { inRange, previousRange, type DateRange } from "./range";
import { money, pct, prettyDate } from "./format";

export interface ProductStat {
  name: string;
  units: number;
  revenue: number;
  productCost: number;
  printing: number;
  packaging: number;
  shipping: number;
  totalCost: number;
  contribution: number;
  contributionPerUnit: number;
  margin: number;
}

export interface Analysis {
  days: DayMetrics[];
  agg: Aggregate;
  prev: Aggregate;
  products: ProductStat[];
  insights: string[];
}

export function analyze(
  rows: DailyRow[],
  settings: CostSettings,
  range: DateRange,
): Analysis {
  const prevRange = previousRange(range);

  const inSel = rows.filter((r) => inRange(r.date, range));
  const inPrev = rows.filter((r) => inRange(r.date, prevRange));

  const days = inSel
    .map((r) => metricsOf(r, settings))
    .sort((a, b) => a.date.localeCompare(b.date));
  const prevDays = inPrev.map((r) => metricsOf(r, settings));

  const agg = aggregate(days, range.from, range.to);
  const prev = aggregate(prevDays, prevRange.from, prevRange.to);

  // Product profitability — shipping allocated per unit share of the day's shipping cost.
  const map = new Map<string, ProductStat>();
  for (const row of inSel) {
    const m = metricsOf(row, settings);
    const lines = linesOf(row);
    const settingsForDay = snapshotToSettings(row.cost_snapshot, settings);
    const totalUnits = lines.reduce((s, l) => s + l.quantity, 0);
    for (const l of lines) {
      if (l.quantity <= 0) continue;
      const key = l.product_name || "Unknown";
      const cur =
        map.get(key) ??
        ({
          name: key,
          units: 0,
          revenue: 0,
          productCost: 0,
          printing: 0,
          packaging: 0,
          shipping: 0,
          totalCost: 0,
          contribution: 0,
          contributionPerUnit: 0,
          margin: 0,
        } satisfies ProductStat);
      const packaging =
        settingsForDay.packaging_mode === "product"
          ? l.quantity * l.packaging_cost
          : totalUnits > 0
            ? (l.quantity / totalUnits) * m.packaging
            : 0;
      const shipping = totalUnits > 0 ? (l.quantity / totalUnits) * m.shipping : 0;
      cur.units += l.quantity;
      cur.revenue += l.quantity * l.selling_price;
      cur.productCost += l.quantity * l.product_cost;
      cur.printing += l.quantity * l.printing_cost;
      cur.packaging += packaging;
      cur.shipping += shipping;
      map.set(key, cur);
    }
  }
  const products = [...map.values()].map((p) => {
    p.totalCost = p.productCost + p.printing + p.packaging + p.shipping;
    p.contribution = p.revenue - p.totalCost;
    p.contributionPerUnit = p.units > 0 ? p.contribution / p.units : 0;
    p.margin = p.revenue > 0 ? (p.contribution / p.revenue) * 100 : 0;
    return p;
  });

  return { days, agg, prev, products, insights: buildInsights(agg, prev, days, products) };
}

function buildInsights(
  agg: Aggregate,
  prev: Aggregate,
  days: DayMetrics[],
  products: ProductStat[],
): string[] {
  const out: string[] = [];
  const has = prev.days > 0;

  if (has && prev.cpa > 0 && agg.cpa > 0) {
    const diff = ((agg.cpa - prev.cpa) / prev.cpa) * 100;
    out.push(
      `CPA ${diff >= 0 ? "increased" : "decreased"} ${pct(Math.abs(diff))} vs the previous period (${money(prev.cpa)} → ${money(agg.cpa)}).`,
    );
  }
  if (has && prev.conversionRate > 0) {
    const diff = agg.conversionRate - prev.conversionRate;
    out.push(
      `Conversion rate ${diff >= 0 ? "improved" : "declined"} by ${Math.abs(diff).toFixed(2)} pts (${pct(prev.conversionRate, 2)} → ${pct(agg.conversionRate, 2)}).`,
    );
  }
  if (has && prev.orders > 0 && agg.orders > 0) {
    const diff = agg.netProfitPerOrder - prev.netProfitPerOrder;
    out.push(
      `Profit per order ${diff >= 0 ? "increased" : "decreased"} by ${money(Math.abs(diff))} (${money(prev.netProfitPerOrder)} → ${money(agg.netProfitPerOrder)}).`,
    );
  }
  if (has && prev.marketingSpend > 0 && prev.netRevenue > 0) {
    const spendDiff = ((agg.marketingSpend - prev.marketingSpend) / prev.marketingSpend) * 100;
    const revDiff = ((agg.netRevenue - prev.netRevenue) / prev.netRevenue) * 100;
    if (spendDiff > 5 && revDiff < spendDiff) {
      out.push(
        `Ad spend rose ${pct(spendDiff)} while revenue changed ${pct(revDiff)} — revenue did not keep pace with spend.`,
      );
    }
  }
  const bestSeller = [...products].sort((a, b) => b.units - a.units)[0];
  if (bestSeller) out.push(`Best-selling product: ${bestSeller.name} (${bestSeller.units} units).`);
  const mostProfitable = [...products].sort((a, b) => b.contribution - a.contribution)[0];
  if (mostProfitable)
    out.push(
      `Most profitable product by contribution: ${mostProfitable.name} (${money(mostProfitable.contribution)}).`,
    );
  if (days.length > 1) {
    const sorted = [...days].sort((a, b) => b.netProfit - a.netProfit);
    const top = sorted[0]!;
    const bottom = sorted[sorted.length - 1]!;
    out.push(`Highest-profit day: ${prettyDate(top.date)} (${money(top.netProfit)}).`);
    out.push(`Lowest-profit day: ${prettyDate(bottom.date)} (${money(bottom.netProfit)}).`);
  }
  if (out.length === 0) out.push("Add a few daily records to start seeing insights.");
  return out;
}

export function monthlyFixedCostForRange(monthlyTotal: number, days: number): number {
  return (n(monthlyTotal) / 30) * days;
}
