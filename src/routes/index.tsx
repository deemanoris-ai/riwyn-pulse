import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AppShell } from "@/components/app-shell";
import { KpiCard } from "@/components/kpi";
import { RangePicker } from "@/components/range-picker";
import { useDailyRecords, useSettings } from "@/lib/db";
import { analyze } from "@/lib/analytics";
import { resolveRange, type DateRange } from "@/lib/range";
import { count, delta, money, pct, ratio, shortDate } from "@/lib/format";
import { DEFAULT_SETTINGS } from "@/lib/calc";
import { Button } from "@/components/ui/button";
import { ProductTable } from "@/components/product-table";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "RǏWYÑ Profit OS — Daily Business Dashboard" },
      {
        name: "description",
        content:
          "Internal RǏWYÑ dashboard for daily revenue, ad spend, unit economics, and net profit tracking in INR.",
      },
      { property: "og:title", content: "RǏWYÑ Profit OS — Daily Business Dashboard" },
      {
        property: "og:description",
        content: "Track revenue, CPA, ROAS, costs and net profit per order for RǏWYÑ.",
      },
    ],
  }),
  component: Dashboard,
});

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactElement;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
      <h3 className="mb-4 text-sm font-semibold">{title}</h3>
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

const axis = {
  stroke: "var(--muted-foreground)",
  fontSize: 11,
  tickLine: false,
  axisLine: false,
};

const tooltipStyle = {
  contentStyle: {
    background: "var(--popover)",
    border: "1px solid var(--border)",
    borderRadius: "10px",
    fontSize: "12px",
  },
};

function Dashboard() {
  const [range, setRange] = useState<DateRange>(() => resolveRange("30d"));
  const { data: rows = [], isLoading } = useDailyRecords();
  const { data: settings } = useSettings();

  const analysis = useMemo(
    () => analyze(rows, settings ?? DEFAULT_SETTINGS, range),
    [rows, settings, range],
  );
  const { agg, prev, days, products, insights } = analysis;

  const chartData = days.map((d) => ({
    date: shortDate(d.date),
    revenue: Math.round(d.netRevenue),
    adSpend: Math.round(d.marketingSpend),
    orders: d.orders,
    profit: Math.round(d.netProfit),
  }));

  return (
    <AppShell
      title="Dashboard"
      description={`${range.from} → ${range.to} · ${agg.days} day${agg.days === 1 ? "" : "s"} with data`}
      actions={
        <Button asChild>
          <Link to="/daily-entry">Add Today&apos;s Numbers</Link>
        </Button>
      }
    >
      <div className="mb-6">
        <RangePicker range={range} onChange={setRange} />
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading your numbers…</p>
      ) : (
        <>
          <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <KpiCard
              label="Revenue"
              value={money(agg.netRevenue)}
              sub="net of discounts & refunds"
              changePct={delta(agg.netRevenue, prev.netRevenue)}
              breakdown={[
                { label: "Net revenue", value: agg.netRevenue, sign: "=" },
                { label: "Customer-paid shipping", value: agg.customerShipping },
              ]}
            />
            <KpiCard label="Orders" value={count(agg.orders)} changePct={delta(agg.orders, prev.orders)} />
            <KpiCard label="Sessions" value={count(agg.sessions)} changePct={delta(agg.sessions, prev.sessions)} />
            <KpiCard
              label="Conversion Rate"
              value={pct(agg.conversionRate, 2)}
              sub="orders ÷ sessions"
            />
            <KpiCard label="AOV" value={money(agg.aov)} sub="revenue ÷ orders" />
            <KpiCard
              label="Ad Spend"
              value={money(agg.marketingSpend)}
              changePct={delta(agg.marketingSpend, prev.marketingSpend)}
              breakdown={[
                { label: "Meta", value: agg.metaSpend, sign: "+" },
                {
                  label: "Agency / influencer / other",
                  value: agg.marketingSpend - agg.metaSpend,
                  sign: "+",
                },
                { label: "Total marketing", value: agg.marketingSpend, sign: "=" },
              ]}
            />
            <KpiCard label="CPA" value={money(agg.cpa)} sub="ad spend ÷ orders" />
            <KpiCard label="ROAS" value={ratio(agg.roas)} sub="revenue ÷ ad spend" />
            <KpiCard
              label="Total Costs"
              value={money(agg.totalCosts)}
              breakdown={[
                { label: "Product COGS", value: agg.cogs, sign: "+" },
                { label: "Printing", value: agg.printing, sign: "+" },
                { label: "Packaging", value: agg.packaging, sign: "+" },
                { label: "Shipping", value: agg.shipping, sign: "+" },
                { label: "Payment fees", value: agg.paymentFees, sign: "+" },
                { label: "COD fees", value: agg.codFees, sign: "+" },
                { label: "RTO costs", value: agg.rtoCost, sign: "+" },
                { label: "Other variable", value: agg.otherVariable, sign: "+" },
                { label: "Marketing", value: agg.marketingSpend, sign: "+" },
                { label: "Total costs", value: agg.totalCosts, sign: "=" },
              ]}
            />
            <KpiCard
              label="Net Profit"
              value={money(agg.netProfit)}
              tone={agg.netProfit >= 0 ? "profit" : "loss"}
              sub="before fixed costs"
              changePct={delta(agg.netProfit, prev.netProfit)}
              breakdown={[
                { label: "Net revenue", value: agg.netRevenue },
                { label: "Variable costs", value: agg.totalVariableCosts, sign: "-" },
                { label: "Marketing", value: agg.marketingSpend, sign: "-" },
                { label: "Net profit", value: agg.netProfit, sign: "=" },
              ]}
            />
            <KpiCard
              label="Profit / Order"
              value={money(agg.netProfitPerOrder)}
              tone={agg.netProfitPerOrder >= 0 ? "profit" : "loss"}
              breakdown={[
                { label: "Contribution / order", value: agg.contributionPerOrder },
                { label: "Marketing / order", value: agg.marketingPerOrder, sign: "-" },
                { label: "Net profit / order", value: agg.netProfitPerOrder, sign: "=" },
              ]}
            />
            <KpiCard
              label="Net Margin"
              value={pct(agg.netMargin)}
              tone={agg.netMargin >= 0 ? "profit" : "loss"}
            />
          </section>

          <section className="mt-6 grid gap-4 lg:grid-cols-2">
            <ChartCard title="Revenue over time">
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="date" {...axis} />
                <YAxis {...axis} width={54} />
                <Tooltip formatter={(v: number) => money(v)} {...tooltipStyle} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  name="Revenue"
                  stroke="var(--chart-1)"
                  fill="var(--chart-1)"
                  fillOpacity={0.12}
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartCard>

            <ChartCard title="Ad spend over time">
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="date" {...axis} />
                <YAxis {...axis} width={54} />
                <Tooltip formatter={(v: number) => money(v)} {...tooltipStyle} />
                <Area
                  type="monotone"
                  dataKey="adSpend"
                  name="Ad spend"
                  stroke="var(--chart-2)"
                  fill="var(--chart-2)"
                  fillOpacity={0.12}
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartCard>

            <ChartCard title="Orders over time">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="date" {...axis} />
                <YAxis {...axis} width={40} allowDecimals={false} />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="orders" name="Orders" fill="var(--chart-3)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartCard>

            <ChartCard title="Net profit over time">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="date" {...axis} />
                <YAxis {...axis} width={54} />
                <Tooltip formatter={(v: number) => money(v)} {...tooltipStyle} />
                <Line
                  type="monotone"
                  dataKey="profit"
                  name="Net profit"
                  stroke="var(--positive)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ChartCard>

            <div className="lg:col-span-2">
              <ChartCard title="Profit vs ad spend">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="date" {...axis} />
                  <YAxis {...axis} width={54} />
                  <Tooltip formatter={(v: number) => money(v)} {...tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line
                    type="monotone"
                    dataKey="profit"
                    name="Net profit"
                    stroke="var(--positive)"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="adSpend"
                    name="Ad spend"
                    stroke="var(--chart-2)"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ChartCard>
            </div>
          </section>

          <section className="mt-6 rounded-xl border border-border bg-card p-5">
            <h3 className="text-sm font-semibold">Business insights</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Factual observations from your stored numbers, compared with {prev.from} → {prev.to}.
            </p>
            <ul className="mt-4 space-y-2 text-sm">
              {insights.map((line, i) => (
                <li key={i} className="flex gap-2">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-muted-foreground" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-6">
            <h3 className="mb-3 text-sm font-semibold">Product profitability</h3>
            <ProductTable products={products} />
          </section>
        </>
      )}
    </AppShell>
  );
}
