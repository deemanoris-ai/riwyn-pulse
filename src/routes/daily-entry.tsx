import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Save } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { NumField, Section, Stat } from "@/components/fields";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useDailyRecords, useProducts, useSaveDaily, useSettings } from "@/lib/db";
import {
  DEFAULT_SETTINGS,
  computeDay,
  isBlocking,
  validateDaily,
  type ProductLine,
} from "@/lib/calc";
import { money, pct, ratio, toISODate } from "@/lib/format";

export const Route = createFileRoute("/daily-entry")({
  head: () => ({
    meta: [
      { title: "Daily Entry — RǏWYÑ Profit OS" },
      {
        name: "description",
        content: "Enter one day of RǏWYÑ sales, traffic, ad spend and units sold; profit is calculated automatically.",
      },
      { property: "og:title", content: "Daily Entry — RǏWYÑ Profit OS" },
      {
        property: "og:description",
        content: "Log today's sales, spend and units in under a minute.",
      },
    ],
  }),
  component: DailyEntry,
});

const EMPTY = {
  gross_sales: 0,
  discounts: 0,
  refunds: 0,
  shipping_charged: 0,
  sessions: 0,
  orders: 0,
  delivered_orders: 0,
  cancelled_orders: 0,
  rto_orders: 0,
  cod_orders: 0,
  meta_spend: 0,
  agency_spend: 0,
  influencer_spend: 0,
  other_marketing_spend: 0,
};

function DailyEntry() {
  const navigate = useNavigate();
  const { data: products = [] } = useProducts();
  const { data: settings } = useSettings();
  const { data: rows = [] } = useDailyRecords();
  const save = useSaveDaily();

  const [date, setDate] = useState(() => toISODate(new Date()));
  const [form, setForm] = useState({ ...EMPTY });
  const [notes, setNotes] = useState("");
  const [qty, setQty] = useState<Record<string, number>>({});

  const existing = rows.find((r) => r.date === date);

  useEffect(() => {
    if (existing) {
      setForm({
        gross_sales: Number(existing.gross_sales),
        discounts: Number(existing.discounts),
        refunds: Number(existing.refunds),
        shipping_charged: Number(existing.shipping_charged),
        sessions: Number(existing.sessions),
        orders: Number(existing.orders),
        delivered_orders: Number(existing.delivered_orders),
        cancelled_orders: Number(existing.cancelled_orders),
        rto_orders: Number(existing.rto_orders),
        cod_orders: Number(existing.cod_orders),
        meta_spend: Number(existing.meta_spend),
        agency_spend: Number(existing.agency_spend),
        influencer_spend: Number(existing.influencer_spend),
        other_marketing_spend: Number(existing.other_marketing_spend),
      });
      setNotes(existing.notes ?? "");
      const q: Record<string, number> = {};
      for (const l of existing.daily_product_sales ?? []) {
        if (l.product_id) q[l.product_id] = Number(l.quantity);
      }
      setQty(q);
    } else {
      setForm({ ...EMPTY });
      setNotes("");
      setQty({});
    }
  }, [existing?.id, date]);

  const set = (key: keyof typeof EMPTY) => (v: number) => setForm((f) => ({ ...f, [key]: v }));

  const activeProducts = products.filter((p) => p.active);

  const lines: ProductLine[] = activeProducts.map((p) => ({
    product_id: p.id,
    product_name: p.name,
    quantity: qty[p.id] ?? 0,
    selling_price: Number(p.selling_price),
    product_cost: Number(p.product_cost),
    printing_cost: Number(p.printing_cost),
    packaging_cost: Number(p.packaging_cost),
  }));

  const metrics = useMemo(
    () => computeDay({ date, ...form }, lines, settings ?? DEFAULT_SETTINGS),
    [date, form, lines, settings],
  );

  const warnings = validateDaily({ date, ...form }, lines);
  const blocked = warnings.some(isBlocking);
  const netRevenue = form.gross_sales - form.discounts - form.refunds;
  const totalMarketing =
    form.meta_spend + form.agency_spend + form.influencer_spend + form.other_marketing_spend;

  async function handleSave() {
    if (blocked) {
      toast.error("Fix the highlighted errors before saving.");
      return;
    }
    try {
      await save.mutateAsync({
        record: { date, ...form, notes },
        lines: Object.entries(qty).map(([product_id, quantity]) => ({ product_id, quantity })),
        products,
        settings: settings ?? DEFAULT_SETTINGS,
      });
      toast.success(`Saved ${date}. Cost settings snapshotted for this day.`);
      void navigate({ to: "/" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save this record.");
    }
  }

  return (
    <AppShell
      title="Daily Entry"
      description="Enter the day's numbers once — everything else is calculated."
      actions={
        <Button onClick={handleSave} disabled={save.isPending}>
          <Save className="size-4" />
          {existing ? "Update day" : "Save day"}
        </Button>
      }
    >
      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          <Section title="Date">
            <div className="max-w-xs space-y-1.5">
              <Label htmlFor="entry-date" className="text-xs text-muted-foreground">
                Business date
              </Label>
              <Input
                id="entry-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="num h-10 bg-card"
              />
              {existing && (
                <p className="text-[11px] text-caution">
                  A record already exists for this date — saving will update it.
                </p>
              )}
            </div>
          </Section>

          <Section title="Sales">
            <div className="grid gap-4 sm:grid-cols-3">
              <NumField label="Gross Sales" prefix="₹" value={form.gross_sales} onChange={set("gross_sales")} />
              <NumField label="Discounts" prefix="₹" value={form.discounts} onChange={set("discounts")} />
              <NumField label="Refunds" prefix="₹" value={form.refunds} onChange={set("refunds")} />
              <NumField
                label="Shipping charged to customers"
                prefix="₹"
                value={form.shipping_charged}
                onChange={set("shipping_charged")}
                hint="Tracked separately — not added to net revenue."
              />
              <NumField label="Number of Orders" value={form.orders} onChange={set("orders")} step="1" />
              <NumField label="COD Orders" value={form.cod_orders} onChange={set("cod_orders")} step="1" />
              <NumField
                label="Delivered Orders"
                value={form.delivered_orders}
                onChange={set("delivered_orders")}
                step="1"
              />
              <NumField
                label="Cancelled Orders"
                value={form.cancelled_orders}
                onChange={set("cancelled_orders")}
                step="1"
              />
              <NumField label="RTO Orders" value={form.rto_orders} onChange={set("rto_orders")} step="1" />
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Stat label="Net Revenue" value={money(netRevenue)} />
              <Stat label="Customer-paid shipping" value={money(form.shipping_charged)} />
            </div>
          </Section>

          <Section title="Traffic & Marketing">
            <div className="grid gap-4 sm:grid-cols-3">
              <NumField label="Sessions" value={form.sessions} onChange={set("sessions")} step="1" />
              <NumField label="Meta Ad Spend" prefix="₹" value={form.meta_spend} onChange={set("meta_spend")} />
              <NumField label="Agency Ad Spend" prefix="₹" value={form.agency_spend} onChange={set("agency_spend")} />
              <NumField
                label="Influencer Spend"
                prefix="₹"
                value={form.influencer_spend}
                onChange={set("influencer_spend")}
              />
              <NumField
                label="Other Marketing Spend"
                prefix="₹"
                value={form.other_marketing_spend}
                onChange={set("other_marketing_spend")}
              />
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-4">
              <Stat label="Total Marketing" value={money(totalMarketing)} />
              <Stat label="CPA" value={money(metrics.cpa)} />
              {form.meta_spend > 0 && <Stat label="Meta CPA" value={money(metrics.metaCpa)} />}
              <Stat label="Conversion rate" value={pct(metrics.conversionRate, 2)} />
            </div>
          </Section>

          <Section
            title="Product Sales"
            description="Quantities sold. Costs are pulled from Products & Costs and snapshotted when you save."
          >
            {activeProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No active products yet — add them in Products &amp; Costs.
              </p>
            ) : (
              <div className="space-y-3">
                {activeProducts.map((p) => {
                  const q = qty[p.id] ?? 0;
                  return (
                    <div
                      key={p.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-background px-3 py-2.5"
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-medium">{p.name}</div>
                        <div className="num text-[11px] text-muted-foreground">
                          {money(p.selling_price)} · cost {money(p.product_cost)} · print{" "}
                          {money(p.printing_cost)} · pack {money(p.packaging_cost)}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="num text-xs text-muted-foreground">
                          COGS {money(q * (Number(p.product_cost) + Number(p.printing_cost)))}
                        </span>
                        <Input
                          type="number"
                          min={0}
                          step={1}
                          value={q}
                          onFocus={(e) => e.currentTarget.select()}
                          onChange={(e) =>
                            setQty((s) => ({ ...s, [p.id]: Number(e.target.value || 0) }))
                          }
                          className="num h-10 w-24 bg-card text-right"
                        />
                      </div>
                    </div>
                  );
                })}
                <div className="grid gap-3 sm:grid-cols-4">
                  <Stat label="Units" value={String(metrics.units)} />
                  <Stat label="Product COGS" value={money(metrics.cogs)} />
                  <Stat label="Printing" value={money(metrics.printing)} />
                  <Stat label="Packaging" value={money(metrics.packaging)} />
                </div>
              </div>
            )}
          </Section>

          <Section title="Notes">
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anything notable about this day…"
              className="bg-card"
            />
          </Section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          {warnings.length > 0 && (
            <div className="rounded-xl border border-caution/40 bg-caution/10 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-caution">
                <AlertTriangle className="size-4" /> Check these
              </div>
              <ul className="mt-2 space-y-1.5 text-xs text-foreground/80">
                {warnings.map((w, i) => (
                  <li key={i}>• {w}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="text-sm font-semibold">Live result</h3>
            <div className="mt-4 grid gap-3 grid-cols-2">
              <Stat label="Revenue" value={money(metrics.netRevenue)} />
              <Stat label="Orders" value={String(metrics.orders)} />
              <Stat label="CPA" value={money(metrics.cpa)} />
              <Stat label="ROAS" value={ratio(metrics.roas)} />
              <Stat label="Total costs" value={money(metrics.totalCosts)} />
              <Stat
                label="Net profit"
                value={money(metrics.netProfit)}
                tone={metrics.netProfit >= 0 ? "profit" : "loss"}
              />
              <Stat
                label="Profit / order"
                value={money(metrics.netProfitPerOrder)}
                tone={metrics.netProfitPerOrder >= 0 ? "profit" : "loss"}
              />
              <Stat label="Margin" value={pct(metrics.netMargin)} />
            </div>
            <div className="mt-4 space-y-1.5 border-t border-border pt-4 text-xs">
              {[
                ["Net revenue", metrics.netRevenue],
                ["− Product COGS", -metrics.cogs],
                ["− Printing", -metrics.printing],
                ["− Packaging", -metrics.packaging],
                ["− Shipping", -metrics.shipping],
                ["− Payment fees", -metrics.paymentFees],
                ["− COD fees", -metrics.codFees],
                ["− RTO costs", -metrics.rtoCost],
                ["− Other variable", -metrics.otherVariable],
                ["− Marketing", -metrics.marketingSpend],
              ].map(([label, value]) => (
                <div key={label as string} className="flex justify-between text-muted-foreground">
                  <span>{label as string}</span>
                  <span className="num">{money(Math.abs(value as number))}</span>
                </div>
              ))}
              <div className="flex justify-between border-t border-border pt-2 font-semibold">
                <span>= Net profit</span>
                <span className="num">{money(metrics.netProfit)}</span>
              </div>
              <p className="pt-2 text-[11px] text-muted-foreground">
                Calculated before monthly fixed costs.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}
