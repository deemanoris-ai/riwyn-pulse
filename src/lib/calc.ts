/**
 * RǏWYÑ calculation engine.
 * Pure functions — no IO. All money in INR.
 */

export type PackagingMode = "product" | "per_order";

export interface CostSettings {
  prepaid_shipping_cost: number;
  cod_shipping_cost: number;
  rto_shipping_cost: number;
  return_shipping_cost: number;
  payment_gateway_percent: number;
  payment_fixed_fee: number;
  cod_fee_per_order: number;
  packaging_mode: PackagingMode;
  packaging_cost_per_order: number;
  other_variable_cost_per_order: number;
}

export const DEFAULT_SETTINGS: CostSettings = {
  prepaid_shipping_cost: 0,
  cod_shipping_cost: 0,
  rto_shipping_cost: 0,
  return_shipping_cost: 0,
  payment_gateway_percent: 0,
  payment_fixed_fee: 0,
  cod_fee_per_order: 0,
  packaging_mode: "product",
  packaging_cost_per_order: 0,
  other_variable_cost_per_order: 0,
};

export interface DailyRecordInput {
  date: string;
  gross_sales: number;
  discounts: number;
  refunds: number;
  shipping_charged: number;
  sessions: number;
  orders: number;
  delivered_orders: number;
  cancelled_orders: number;
  rto_orders: number;
  cod_orders: number;
  meta_spend: number;
  agency_spend: number;
  influencer_spend: number;
  other_marketing_spend: number;
}

export interface ProductLine {
  product_id: string | null;
  product_name: string;
  quantity: number;
  selling_price: number;
  product_cost: number;
  printing_cost: number;
  packaging_cost: number;
}

export interface DayMetrics {
  date: string;
  netRevenue: number;
  customerShipping: number;
  sessions: number;
  orders: number;
  units: number;
  conversionRate: number;
  aov: number;
  marketingSpend: number;
  metaSpend: number;
  cpa: number;
  metaCpa: number;
  roas: number;
  cogs: number;
  printing: number;
  packaging: number;
  shipping: number;
  paymentFees: number;
  codFees: number;
  rtoCost: number;
  otherVariable: number;
  totalVariableCosts: number;
  totalCosts: number;
  contributionProfit: number;
  netProfit: number;
  netProfitPerOrder: number;
  contributionPerOrder: number;
  marketingPerOrder: number;
  cogsPerOrder: number;
  netMargin: number;
  breakEvenCpa: number;
  breakEvenRoas: number;
  prepaidShipped: number;
  codShipped: number;
}

const div = (a: number, b: number) => (b > 0 ? a / b : 0);
export const n = (v: unknown): number => {
  const x = typeof v === "string" ? parseFloat(v) : (v as number);
  return Number.isFinite(x) ? x : 0;
};

export function computeDay(
  record: DailyRecordInput,
  lines: ProductLine[],
  settings: CostSettings,
): DayMetrics {
  const grossSales = n(record.gross_sales);
  const netRevenue = grossSales - n(record.discounts) - n(record.refunds);
  const orders = n(record.orders);
  const sessions = n(record.sessions);
  const cancelled = n(record.cancelled_orders);
  const rto = n(record.rto_orders);

  const units = lines.reduce((s, l) => s + n(l.quantity), 0);
  const cogs = lines.reduce((s, l) => s + n(l.quantity) * n(l.product_cost), 0);
  const printing = lines.reduce((s, l) => s + n(l.quantity) * n(l.printing_cost), 0);
  const packaging =
    settings.packaging_mode === "product"
      ? lines.reduce((s, l) => s + n(l.quantity) * n(l.packaging_cost), 0)
      : orders * n(settings.packaging_cost_per_order);

  const shippedOrders = Math.max(orders - cancelled, 0);
  const codShipped = Math.min(Math.max(n(record.cod_orders), 0), shippedOrders);
  const prepaidShipped = Math.max(shippedOrders - codShipped, 0);

  const shipping =
    prepaidShipped * n(settings.prepaid_shipping_cost) +
    codShipped * n(settings.cod_shipping_cost);

  const paymentFees =
    (n(settings.payment_gateway_percent) / 100) * Math.max(netRevenue, 0) +
    n(settings.payment_fixed_fee) * prepaidShipped;

  const codFees = codShipped * n(settings.cod_fee_per_order);
  const rtoCost = rto * n(settings.rto_shipping_cost);
  const otherVariable = orders * n(settings.other_variable_cost_per_order);

  const totalVariableCosts =
    cogs + printing + packaging + shipping + paymentFees + codFees + rtoCost + otherVariable;

  const metaSpend = n(record.meta_spend);
  const marketingSpend =
    metaSpend + n(record.agency_spend) + n(record.influencer_spend) + n(record.other_marketing_spend);

  const contributionProfit = netRevenue - totalVariableCosts;
  const netProfit = contributionProfit - marketingSpend;
  const totalCosts = totalVariableCosts + marketingSpend;

  return {
    date: record.date,
    netRevenue,
    customerShipping: n(record.shipping_charged),
    sessions,
    orders,
    units,
    conversionRate: div(orders, sessions) * 100,
    aov: div(netRevenue, orders),
    marketingSpend,
    metaSpend,
    cpa: div(marketingSpend, orders),
    metaCpa: div(metaSpend, orders),
    roas: div(netRevenue, marketingSpend),
    cogs,
    printing,
    packaging,
    shipping,
    paymentFees,
    codFees,
    rtoCost,
    otherVariable,
    totalVariableCosts,
    totalCosts,
    contributionProfit,
    netProfit,
    netProfitPerOrder: div(netProfit, orders),
    contributionPerOrder: div(contributionProfit, orders),
    marketingPerOrder: div(marketingSpend, orders),
    cogsPerOrder: div(cogs, orders),
    netMargin: div(netProfit, netRevenue) * 100,
    breakEvenCpa: div(contributionProfit, orders),
    breakEvenRoas: div(netRevenue, Math.max(contributionProfit, 0.000001)),
    prepaidShipped,
    codShipped,
  };
}

export interface Aggregate extends Omit<DayMetrics, "date"> {
  days: number;
  from: string;
  to: string;
}

export function aggregate(days: DayMetrics[], from: string, to: string): Aggregate {
  const sum = (pick: (d: DayMetrics) => number) => days.reduce((s, d) => s + pick(d), 0);

  const netRevenue = sum((d) => d.netRevenue);
  const orders = sum((d) => d.orders);
  const sessions = sum((d) => d.sessions);
  const marketingSpend = sum((d) => d.marketingSpend);
  const totalVariableCosts = sum((d) => d.totalVariableCosts);
  const contributionProfit = netRevenue - totalVariableCosts;
  const netProfit = contributionProfit - marketingSpend;

  return {
    days: days.length,
    from,
    to,
    netRevenue,
    customerShipping: sum((d) => d.customerShipping),
    sessions,
    orders,
    units: sum((d) => d.units),
    conversionRate: div(orders, sessions) * 100,
    aov: div(netRevenue, orders),
    marketingSpend,
    metaSpend: sum((d) => d.metaSpend),
    cpa: div(marketingSpend, orders),
    metaCpa: div(sum((d) => d.metaSpend), orders),
    roas: div(netRevenue, marketingSpend),
    cogs: sum((d) => d.cogs),
    printing: sum((d) => d.printing),
    packaging: sum((d) => d.packaging),
    shipping: sum((d) => d.shipping),
    paymentFees: sum((d) => d.paymentFees),
    codFees: sum((d) => d.codFees),
    rtoCost: sum((d) => d.rtoCost),
    otherVariable: sum((d) => d.otherVariable),
    totalVariableCosts,
    totalCosts: totalVariableCosts + marketingSpend,
    contributionProfit,
    netProfit,
    netProfitPerOrder: div(netProfit, orders),
    contributionPerOrder: div(contributionProfit, orders),
    marketingPerOrder: div(marketingSpend, orders),
    cogsPerOrder: div(sum((d) => d.cogs), orders),
    netMargin: div(netProfit, netRevenue) * 100,
    breakEvenCpa: div(contributionProfit, orders),
    breakEvenRoas: div(netRevenue, Math.max(contributionProfit, 0.000001)),
    prepaidShipped: sum((d) => d.prepaidShipped),
    codShipped: sum((d) => d.codShipped),
  };
}

/* ---------------- Unit economics ---------------- */

export interface UnitEconomicsInput {
  sellingPrice: number;
  productCost: number;
  printing: number;
  packaging: number;
  shipping: number;
  paymentFeePercent: number;
  codFee: number;
  otherVariable: number;
  expectedCpa: number;
}

export interface UnitEconomicsResult {
  variableCosts: number;
  paymentFee: number;
  contributionBeforeAds: number;
  profitAfterAds: number;
  breakEvenCpa: number;
  breakEvenRoas: number;
  marginAfterAds: number;
  status: "profitable" | "low" | "loss";
}

export function computeUnitEconomics(i: UnitEconomicsInput): UnitEconomicsResult {
  const paymentFee = (n(i.paymentFeePercent) / 100) * n(i.sellingPrice);
  const variableCosts =
    n(i.productCost) + n(i.printing) + n(i.packaging) + n(i.shipping) + paymentFee + n(i.codFee) + n(i.otherVariable);
  const contributionBeforeAds = n(i.sellingPrice) - variableCosts;
  const profitAfterAds = contributionBeforeAds - n(i.expectedCpa);
  const breakEvenCpa = contributionBeforeAds;
  const breakEvenRoas = contributionBeforeAds > 0 ? n(i.sellingPrice) / contributionBeforeAds : 0;
  const marginAfterAds = div(profitAfterAds, n(i.sellingPrice)) * 100;

  const status: UnitEconomicsResult["status"] =
    profitAfterAds < 0 ? "loss" : marginAfterAds < 10 ? "low" : "profitable";

  return {
    variableCosts,
    paymentFee,
    contributionBeforeAds,
    profitAfterAds,
    breakEvenCpa,
    breakEvenRoas,
    marginAfterAds,
    status,
  };
}

/* ---------------- Ad scaling scenarios ---------------- */

export interface ScenarioInput {
  dailyBudget: number;
  expectedCpa: number;
  aov: number;
  variableCostPerOrder: number;
}

export interface ScenarioResult {
  dailyBudget: number;
  expectedOrders: number;
  displayOrders: string;
  expectedRevenue: number;
  expectedAdSpend: number;
  expectedVariableCosts: number;
  expectedProfit: number;
  expectedMargin: number;
  expectedRoas: number;
}

export function computeScenario(i: ScenarioInput): ScenarioResult {
  const orders = n(i.expectedCpa) > 0 ? n(i.dailyBudget) / n(i.expectedCpa) : 0;
  const revenue = orders * n(i.aov);
  const variable = orders * n(i.variableCostPerOrder);
  const profit = revenue - variable - n(i.dailyBudget);
  return {
    dailyBudget: n(i.dailyBudget),
    expectedOrders: orders,
    displayOrders: orders.toFixed(1),
    expectedRevenue: revenue,
    expectedAdSpend: n(i.dailyBudget),
    expectedVariableCosts: variable,
    expectedProfit: profit,
    expectedMargin: div(profit, revenue) * 100,
    expectedRoas: div(revenue, n(i.dailyBudget)),
  };
}

/* ---------------- Validation ---------------- */

export function validateDaily(r: DailyRecordInput, lines: ProductLine[]): string[] {
  const w: string[] = [];
  const negative = [
    ["Gross sales", r.gross_sales],
    ["Discounts", r.discounts],
    ["Refunds", r.refunds],
    ["Sessions", r.sessions],
    ["Orders", r.orders],
    ["Delivered orders", r.delivered_orders],
    ["Cancelled orders", r.cancelled_orders],
    ["RTO orders", r.rto_orders],
    ["COD orders", r.cod_orders],
    ["Meta spend", r.meta_spend],
    ["Agency spend", r.agency_spend],
    ["Influencer spend", r.influencer_spend],
    ["Other marketing spend", r.other_marketing_spend],
  ] as const;
  for (const [label, value] of negative) {
    if (n(value) < 0) w.push(`${label} cannot be negative.`);
  }
  if (lines.some((l) => n(l.quantity) < 0)) w.push("Product quantities cannot be negative.");
  if (n(r.orders) > n(r.sessions) && n(r.sessions) > 0)
    w.push("Orders are higher than sessions — double-check the traffic number.");
  if (n(r.delivered_orders) + n(r.cancelled_orders) + n(r.rto_orders) > n(r.orders))
    w.push("Delivered + cancelled + RTO orders exceed total orders.");
  if (n(r.gross_sales) > 0 && n(r.orders) === 0)
    w.push("Revenue is entered but orders are 0 — per-order metrics will be blank.");
  if (
    n(r.meta_spend) + n(r.agency_spend) + n(r.influencer_spend) + n(r.other_marketing_spend) > 0 &&
    n(r.orders) === 0
  )
    w.push("Ad spend is entered but orders are 0 — CPA and ROAS cannot be calculated.");
  if (n(r.cod_orders) > n(r.orders)) w.push("COD orders exceed total orders.");
  return w;
}

export function isBlocking(warning: string): boolean {
  return warning.includes("cannot be negative");
}
