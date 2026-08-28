import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { NumField, Section, Stat } from "@/components/fields";
import { computeScenario, computeUnitEconomics } from "@/lib/calc";
import { money, pct, ratio } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useProducts, useSettings } from "@/lib/db";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/calculator")({
  head: () => ({
    meta: [
      { title: "Profit Calculator — RǏWYÑ Profit OS" },
      {
        name: "description",
        content:
          "Unit economics, break-even CPA and ROAS, plus an ad-budget scaling calculator for RǏWYÑ.",
      },
      { property: "og:title", content: "Profit Calculator — RǏWYÑ Profit OS" },
      {
        property: "og:description",
        content: "Model unit economics and ad scaling without touching saved records.",
      },
    ],
  }),
  component: CalculatorPage,
});

const STATUS = {
  profitable: { label: "🟢 Profitable", cls: "text-positive" },
  low: { label: "🟡 Low margin", cls: "text-caution" },
  loss: { label: "🔴 Losing money", cls: "text-negative" },
} as const;

const BUDGETS = [500, 1000, 1500, 2000, 3000];

function CalculatorPage() {
  const { data: products = [] } = useProducts();
  const { data: settings } = useSettings();

  const [ue, setUe] = useState({
    sellingPrice: 1599,
    productCost: 450,
    printing: 90,
    packaging: 25,
    shipping: 70,
    paymentFeePercent: 2.36,
    codFee: 0,
    otherVariable: 10,
    expectedCpa: 300,
  });

  const [scenario, setScenario] = useState({
    expectedCpa: 200,
    aov: 1599,
    variableCostPerOrder: 700,
    dailyBudget: 1500,
  });

  const result = useMemo(() => computeUnitEconomics(ue), [ue]);
  const status = STATUS[result.status];

  const single = computeScenario({
    dailyBudget: scenario.dailyBudget,
    expectedCpa: scenario.expectedCpa,
    aov: scenario.aov,
    variableCostPerOrder: scenario.variableCostPerOrder,
  });

  const comparison = BUDGETS.map((b) =>
    computeScenario({
      dailyBudget: b,
      expectedCpa: scenario.expectedCpa,
      aov: scenario.aov,
      variableCostPerOrder: scenario.variableCostPerOrder,
    }),
  );

  const set = (k: keyof typeof ue) => (v: number) => setUe((s) => ({ ...s, [k]: v }));
  const setS = (k: keyof typeof scenario) => (v: number) => setScenario((s) => ({ ...s, [k]: v }));

  function loadProduct(id: string) {
    const p = products.find((x) => x.id === id);
    if (!p) return;
    setUe((s) => ({
      ...s,
      sellingPrice: Number(p.selling_price),
      productCost: Number(p.product_cost),
      printing: Number(p.printing_cost),
      packaging: Number(p.packaging_cost),
      shipping: Number(settings?.prepaid_shipping_cost ?? s.shipping),
      paymentFeePercent: Number(settings?.payment_gateway_percent ?? s.paymentFeePercent),
      otherVariable: Number(settings?.other_variable_cost_per_order ?? s.otherVariable),
    }));
  }

  return (
    <AppShell
      title="Profit Calculator"
      description="Scratchpad for unit economics and ad scaling. Nothing here changes your saved daily records."
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="Unit economics inputs" description="Per single order / unit.">
          {products.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              <span className="self-center text-xs text-muted-foreground">Prefill from:</span>
              {products.map((p) => (
                <Button key={p.id} variant="outline" size="sm" onClick={() => loadProduct(p.id)}>
                  {p.name}
                </Button>
              ))}
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-3">
            <NumField label="Selling Price" prefix="₹" value={ue.sellingPrice} onChange={set("sellingPrice")} />
            <NumField label="Product Cost" prefix="₹" value={ue.productCost} onChange={set("productCost")} />
            <NumField label="Printing" prefix="₹" value={ue.printing} onChange={set("printing")} />
            <NumField label="Packaging" prefix="₹" value={ue.packaging} onChange={set("packaging")} />
            <NumField label="Shipping" prefix="₹" value={ue.shipping} onChange={set("shipping")} />
            <NumField
              label="Payment Fee"
              suffix="%"
              value={ue.paymentFeePercent}
              onChange={set("paymentFeePercent")}
            />
            <NumField label="COD Fee" prefix="₹" value={ue.codFee} onChange={set("codFee")} />
            <NumField
              label="Other Variable Cost"
              prefix="₹"
              value={ue.otherVariable}
              onChange={set("otherVariable")}
            />
            <NumField label="Expected CPA" prefix="₹" value={ue.expectedCpa} onChange={set("expectedCpa")} />
          </div>
        </Section>

        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wider">Per-order result</h2>
              <span className={cn("text-sm font-semibold", status.cls)}>{status.label}</span>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Stat label="Contribution before ads" value={money(result.contributionBeforeAds, true)} />
              <Stat
                label="Profit after ads"
                value={money(result.profitAfterAds, true)}
                tone={result.profitAfterAds >= 0 ? "profit" : "loss"}
              />
              <Stat label="Break-even CPA" value={money(result.breakEvenCpa, true)} />
              <Stat label="Break-even ROAS" value={ratio(result.breakEvenRoas)} />
              <Stat label="Total variable cost" value={money(result.variableCosts, true)} />
              <Stat label="Margin after ads" value={pct(result.marginAfterAds)} />
            </div>
            <div className="mt-4 space-y-1.5 border-t border-border pt-4 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>Selling price</span>
                <span className="num">{money(ue.sellingPrice)}</span>
              </div>
              <div className="flex justify-between">
                <span>− Non-ad variable costs</span>
                <span className="num">{money(result.variableCosts, true)}</span>
              </div>
              <div className="flex justify-between">
                <span>− Expected CPA</span>
                <span className="num">{money(ue.expectedCpa)}</span>
              </div>
              <div className="flex justify-between border-t border-border pt-2 font-semibold text-foreground">
                <span>= Profit after ads</span>
                <span className="num">{money(result.profitAfterAds, true)}</span>
              </div>
              <p className="pt-2">
                Payment fee of {pct(ue.paymentFeePercent, 2)} = {money(result.paymentFee, true)}.
              </p>
            </div>
          </div>
        </div>
      </div>

      <Section
        title="“What if?” ad scaling"
        description="Estimate the outcome of different daily ad budgets. Orders are modelled with decimals and shown to one decimal place."
      >
        <div className="grid gap-4 sm:grid-cols-4">
          <NumField label="Daily Ad Budget" prefix="₹" value={scenario.dailyBudget} onChange={setS("dailyBudget")} />
          <NumField label="Expected CPA" prefix="₹" value={scenario.expectedCpa} onChange={setS("expectedCpa")} />
          <NumField label="Average Order Value" prefix="₹" value={scenario.aov} onChange={setS("aov")} />
          <NumField
            label="Variable Cost / Order"
            prefix="₹"
            value={scenario.variableCostPerOrder}
            onChange={setS("variableCostPerOrder")}
          />
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-4 lg:grid-cols-7">
          <Stat label="Expected orders" value={single.displayOrders} />
          <Stat label="Expected revenue" value={money(single.expectedRevenue)} />
          <Stat label="Expected ad spend" value={money(single.expectedAdSpend)} />
          <Stat label="Expected variable costs" value={money(single.expectedVariableCosts)} />
          <Stat
            label="Expected profit"
            value={money(single.expectedProfit)}
            tone={single.expectedProfit >= 0 ? "profit" : "loss"}
          />
          <Stat label="Expected margin" value={pct(single.expectedMargin)} />
          <Stat label="Expected ROAS" value={ratio(single.expectedRoas)} />
        </div>

        <div className="mt-6 overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-border bg-background text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3 font-semibold">Daily budget</th>
                <th className="px-4 py-3 text-right font-semibold">Orders</th>
                <th className="px-4 py-3 text-right font-semibold">Revenue</th>
                <th className="px-4 py-3 text-right font-semibold">Variable costs</th>
                <th className="px-4 py-3 text-right font-semibold">Profit</th>
                <th className="px-4 py-3 text-right font-semibold">Margin</th>
                <th className="px-4 py-3 text-right font-semibold">ROAS</th>
              </tr>
            </thead>
            <tbody>
              {comparison.map((s) => (
                <tr key={s.dailyBudget} className="border-b border-border/60 last:border-0">
                  <td className="num px-4 py-3 font-medium">{money(s.dailyBudget)}/day</td>
                  <td className="num px-4 py-3 text-right">{s.displayOrders}</td>
                  <td className="num px-4 py-3 text-right">{money(s.expectedRevenue)}</td>
                  <td className="num px-4 py-3 text-right">{money(s.expectedVariableCosts)}</td>
                  <td
                    className={cn(
                      "num px-4 py-3 text-right font-semibold",
                      s.expectedProfit >= 0 ? "text-positive" : "text-negative",
                    )}
                  >
                    {money(s.expectedProfit)}
                  </td>
                  <td className="num px-4 py-3 text-right">{pct(s.expectedMargin)}</td>
                  <td className="num px-4 py-3 text-right">{ratio(s.expectedRoas)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </AppShell>
  );
}
