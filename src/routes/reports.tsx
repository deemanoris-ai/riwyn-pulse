import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Download, Search } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { RangePicker } from "@/components/range-picker";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useDailyRecords, useFixedCosts, useSettings, metricsOf, type DailyRow } from "@/lib/db";
import { DEFAULT_SETTINGS, aggregate, type DayMetrics } from "@/lib/calc";
import { resolveRange, inRange, previousRange, type DateRange } from "@/lib/range";
import { count, delta, money, pct, prettyDate, ratio } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "Reports & History — RǏWYÑ Profit OS" },
      {
        name: "description",
        content:
          "Day-by-day RǏWYÑ history with costs, profit, margin, period totals, previous-period comparison and CSV export.",
      },
      { property: "og:title", content: "Reports & History — RǏWYÑ Profit OS" },
      {
        property: "og:description",
        content: "Search, filter, sort and export your daily profit history.",
      },
    ],
  }),
  component: ReportsPage,
});

type SortKey = "date" | "netRevenue" | "orders" | "netProfit" | "marketingSpend" | "netMargin";

function ReportsPage() {
  const [range, setRange] = useState<DateRange>(() => resolveRange("30d"));
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("date");
  const [asc, setAsc] = useState(false);
  const [openRow, setOpenRow] = useState<{ row: DailyRow; m: DayMetrics } | null>(null);

  const { data: rows = [] } = useDailyRecords();
  const { data: settings } = useSettings();
  const { data: fixedCosts = [] } = useFixedCosts();

  const monthlyFixed = fixedCosts
    .filter((f) => f.active)
    .reduce((s, f) => s + Number(f.monthly_amount), 0);

  const base = settings ?? DEFAULT_SETTINGS;

  const table = useMemo(() => {
    const list = rows
      .filter((r) => inRange(r.date, range))
      .filter((r) =>
        search.trim()
          ? `${r.date} ${r.notes ?? ""}`.toLowerCase().includes(search.trim().toLowerCase())
          : true,
      )
      .map((r) => ({ row: r, m: metricsOf(r, base) }));
    list.sort((a, b) => {
      const av = sort === "date" ? a.m.date : a.m[sort];
      const bv = sort === "date" ? b.m.date : b.m[sort];
      const cmp = typeof av === "string" ? av.localeCompare(bv as string) : (av as number) - (bv as number);
      return asc ? cmp : -cmp;
    });
    return list;
  }, [rows, range, search, sort, asc, base]);

  const prevR = previousRange(range);
  const agg = aggregate(
    rows.filter((r) => inRange(r.date, range)).map((r) => metricsOf(r, base)),
    range.from,
    range.to,
  );
  const prev = aggregate(
    rows.filter((r) => inRange(r.date, prevR)).map((r) => metricsOf(r, base)),
    prevR.from,
    prevR.to,
  );

  const fixedForRange = (monthlyFixed / 30) * Math.max(agg.days, 0);

  function exportCsv() {
    const header = [
      "Date",
      "Sessions",
      "Orders",
      "Revenue",
      "Ad Spend",
      "CPA",
      "ROAS",
      "COGS",
      "Shipping",
      "Total Costs",
      "Net Profit",
      "Profit/Order",
      "Margin %",
    ];
    const lines = table.map(({ m }) =>
      [
        m.date,
        m.sessions,
        m.orders,
        m.netRevenue.toFixed(2),
        m.marketingSpend.toFixed(2),
        m.cpa.toFixed(2),
        m.roas.toFixed(2),
        m.cogs.toFixed(2),
        m.shipping.toFixed(2),
        m.totalCosts.toFixed(2),
        m.netProfit.toFixed(2),
        m.netProfitPerOrder.toFixed(2),
        m.netMargin.toFixed(2),
      ].join(","),
    );
    const blob = new Blob([[header.join(","), ...lines].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `riwyn-report-${range.from}-to-${range.to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function toggleSort(k: SortKey) {
    if (k === sort) setAsc((v) => !v);
    else {
      setSort(k);
      setAsc(false);
    }
  }

  const summary: [string, string, number | null][] = [
    ["Total Revenue", money(agg.netRevenue), delta(agg.netRevenue, prev.netRevenue)],
    ["Total Orders", count(agg.orders), delta(agg.orders, prev.orders)],
    ["Total Sessions", count(agg.sessions), delta(agg.sessions, prev.sessions)],
    ["Conversion Rate", pct(agg.conversionRate, 2), delta(agg.conversionRate, prev.conversionRate)],
    ["Total Ad Spend", money(agg.marketingSpend), delta(agg.marketingSpend, prev.marketingSpend)],
    ["Average CPA", money(agg.cpa), delta(agg.cpa, prev.cpa)],
    ["Average AOV", money(agg.aov), delta(agg.aov, prev.aov)],
    ["Total COGS", money(agg.cogs), delta(agg.cogs, prev.cogs)],
    ["Total Shipping", money(agg.shipping), delta(agg.shipping, prev.shipping)],
    [
      "Total Fees",
      money(agg.paymentFees + agg.codFees),
      delta(agg.paymentFees + agg.codFees, prev.paymentFees + prev.codFees),
    ],
    ["Total Costs", money(agg.totalCosts), delta(agg.totalCosts, prev.totalCosts)],
    ["Operating Profit (before fixed)", money(agg.netProfit), delta(agg.netProfit, prev.netProfit)],
    ["Net Profit After Fixed Costs", money(agg.netProfit - fixedForRange), null],
    ["Profit / Order", money(agg.netProfitPerOrder), delta(agg.netProfitPerOrder, prev.netProfitPerOrder)],
    ["Net Margin", pct(agg.netMargin), delta(agg.netMargin, prev.netMargin)],
    ["ROAS", ratio(agg.roas), delta(agg.roas, prev.roas)],
  ];

  const COLS: { key: SortKey | null; label: string }[] = [
    { key: "date", label: "Date" },
    { key: null, label: "Sessions" },
    { key: "orders", label: "Orders" },
    { key: "netRevenue", label: "Revenue" },
    { key: "marketingSpend", label: "Ad spend" },
    { key: null, label: "CPA" },
    { key: null, label: "ROAS" },
    { key: null, label: "COGS" },
    { key: null, label: "Shipping" },
    { key: null, label: "Total costs" },
    { key: "netProfit", label: "Net profit" },
    { key: null, label: "Profit/order" },
    { key: "netMargin", label: "Margin" },
  ];

  return (
    <AppShell
      title="Reports & History"
      description="One row per day. Click any day to see the full calculation."
      actions={
        <Button variant="outline" onClick={exportCsv}>
          <Download className="size-4" /> Export CSV
        </Button>
      }
    >
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <RangePicker range={range} onChange={setRange} />
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search date or notes"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-56 bg-card pl-9"
          />
        </div>
      </div>

      <section className="mb-6 rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider">
          Period summary
          <span className="ml-2 font-normal normal-case text-muted-foreground">
            vs {prevR.from} → {prevR.to}
          </span>
        </h2>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
          {summary.map(([label, value, d]) => (
            <div key={label}>
              <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                {label}
              </div>
              <div className="num mt-1 text-lg font-semibold">{value}</div>
              {typeof d === "number" && Number.isFinite(d) && (
                <div className={cn("text-xs", d >= 0 ? "text-positive" : "text-negative")}>
                  {d >= 0 ? "↑" : "↓"} {pct(Math.abs(d))}
                </div>
              )}
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          Fixed costs allocated for this period: {money(fixedForRange)} ({money(monthlyFixed)}/month
          ÷ 30 × {agg.days} days).
        </p>
      </section>

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full min-w-[1100px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
              {COLS.map((c) => (
                <th
                  key={c.label}
                  onClick={() => c.key && toggleSort(c.key)}
                  className={cn(
                    "px-4 py-3 font-semibold",
                    c.label === "Date" ? "text-left" : "text-right",
                    c.key && "cursor-pointer select-none hover:text-foreground",
                  )}
                >
                  {c.label}
                  {sort === c.key ? (asc ? " ↑" : " ↓") : ""}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.length === 0 && (
              <tr>
                <td colSpan={13} className="px-4 py-10 text-center text-muted-foreground">
                  No records in this range.
                </td>
              </tr>
            )}
            {table.map(({ row, m }) => (
              <tr
                key={row.id}
                onClick={() => setOpenRow({ row, m })}
                className="cursor-pointer border-b border-border/60 last:border-0 hover:bg-secondary/60"
              >
                <td className="px-4 py-3 font-medium">
                  <span className="num">{prettyDate(m.date)}</span>
                  {row.is_demo && (
                    <Badge variant="secondary" className="ml-2">
                      Demo
                    </Badge>
                  )}
                </td>
                <td className="num px-4 py-3 text-right">{count(m.sessions)}</td>
                <td className="num px-4 py-3 text-right">{count(m.orders)}</td>
                <td className="num px-4 py-3 text-right">{money(m.netRevenue)}</td>
                <td className="num px-4 py-3 text-right">{money(m.marketingSpend)}</td>
                <td className="num px-4 py-3 text-right">{money(m.cpa)}</td>
                <td className="num px-4 py-3 text-right">{ratio(m.roas)}</td>
                <td className="num px-4 py-3 text-right">{money(m.cogs)}</td>
                <td className="num px-4 py-3 text-right">{money(m.shipping)}</td>
                <td className="num px-4 py-3 text-right">{money(m.totalCosts)}</td>
                <td
                  className={cn(
                    "num px-4 py-3 text-right font-semibold",
                    m.netProfit >= 0 ? "text-positive" : "text-negative",
                  )}
                >
                  {money(m.netProfit)}
                </td>
                <td className="num px-4 py-3 text-right">{money(m.netProfitPerOrder)}</td>
                <td className="num px-4 py-3 text-right">{pct(m.netMargin)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={!!openRow} onOpenChange={(v) => !v && setOpenRow(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          {openRow && (
            <>
              <DialogHeader>
                <DialogTitle>{prettyDate(openRow.m.date)}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  {(
                    [
                      ["Gross sales", money(Number(openRow.row.gross_sales))],
                      ["Discounts", money(Number(openRow.row.discounts))],
                      ["Refunds", money(Number(openRow.row.refunds))],
                      ["Net revenue", money(openRow.m.netRevenue)],
                      ["Sessions", count(openRow.m.sessions)],
                      ["Orders", count(openRow.m.orders)],
                      ["Delivered", count(Number(openRow.row.delivered_orders))],
                      ["Cancelled", count(Number(openRow.row.cancelled_orders))],
                      ["RTO", count(Number(openRow.row.rto_orders))],
                      ["COD", count(Number(openRow.row.cod_orders))],
                    ] as const
                  ).map(([l, v]) => (
                    <div key={l} className="rounded-lg border border-border px-3 py-2">
                      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                        {l}
                      </div>
                      <div className="num mt-0.5 font-semibold">{v}</div>
                    </div>
                  ))}
                </div>

                <div>
                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Units sold
                  </h4>
                  {(openRow.row.daily_product_sales ?? []).filter((l) => l.quantity > 0).length ===
                  0 ? (
                    <p className="text-xs text-muted-foreground">No product quantities recorded.</p>
                  ) : (
                    <div className="space-y-1">
                      {(openRow.row.daily_product_sales ?? [])
                        .filter((l) => l.quantity > 0)
                        .map((l) => (
                          <div key={l.id} className="flex justify-between">
                            <span>{l.product_name}</span>
                            <span className="num text-muted-foreground">
                              {l.quantity} × {money(Number(l.product_cost_snapshot))} cost
                            </span>
                          </div>
                        ))}
                    </div>
                  )}
                </div>

                <div className="space-y-1.5 border-t border-border pt-3">
                  {(
                    [
                      ["Net revenue", openRow.m.netRevenue],
                      ["− Product COGS", -openRow.m.cogs],
                      ["− Printing", -openRow.m.printing],
                      ["− Packaging", -openRow.m.packaging],
                      ["− Shipping", -openRow.m.shipping],
                      ["− Payment fees", -openRow.m.paymentFees],
                      ["− COD fees", -openRow.m.codFees],
                      ["− RTO costs", -openRow.m.rtoCost],
                      ["− Other variable", -openRow.m.otherVariable],
                      ["− Marketing", -openRow.m.marketingSpend],
                    ] as const
                  ).map(([l, v]) => (
                    <div key={l} className="flex justify-between text-muted-foreground">
                      <span>{l}</span>
                      <span className="num">{money(Math.abs(v))}</span>
                    </div>
                  ))}
                  <div className="flex justify-between border-t border-border pt-2 font-semibold">
                    <span>= Net profit</span>
                    <span
                      className={cn(
                        "num",
                        openRow.m.netProfit >= 0 ? "text-positive" : "text-negative",
                      )}
                    >
                      {money(openRow.m.netProfit)}
                    </span>
                  </div>
                </div>
                {openRow.row.notes && (
                  <p className="rounded-lg bg-secondary px-3 py-2 text-xs">{openRow.row.notes}</p>
                )}
                <p className="text-[11px] text-muted-foreground">
                  Calculated with the cost settings snapshotted on this day.
                </p>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
