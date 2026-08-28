import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { NumField, Section } from "@/components/fields";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useFixedCosts, useInvalidateAll, useSettings } from "@/lib/db";
import { DEFAULT_SETTINGS, type CostSettings } from "@/lib/calc";
import { money } from "@/lib/format";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — RǏWYÑ Profit OS" },
      {
        name: "description",
        content:
          "Configure RǏWYÑ shipping, payment gateway, COD, RTO, packaging logic and monthly fixed costs.",
      },
      { property: "og:title", content: "Settings — RǏWYÑ Profit OS" },
      {
        property: "og:description",
        content: "Business cost assumptions and monthly fixed costs.",
      },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { data: saved } = useSettings();
  const { data: fixedCosts = [] } = useFixedCosts();
  const invalidate = useInvalidateAll();

  const [form, setForm] = useState<CostSettings>(DEFAULT_SETTINGS);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState({ name: "", monthly_amount: 0 });

  useEffect(() => {
    if (saved) {
      const { id: _id, ...rest } = saved;
      setForm(rest);
    }
  }, [saved?.id, saved?.prepaid_shipping_cost]);

  const set = (k: keyof CostSettings) => (v: number) => setForm((f) => ({ ...f, [k]: v }));

  async function saveSettings() {
    setSaving(true);
    const { error } = saved?.id
      ? await supabase.from("business_cost_settings").update(form as never).eq("id", saved.id)
      : await supabase.from("business_cost_settings").insert(form as never);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    invalidate();
    toast.success("Cost settings saved. Existing daily records keep their original snapshots.");
  }

  async function addFixed() {
    if (!draft.name.trim()) {
      toast.error("Name the fixed cost.");
      return;
    }
    const { error } = await supabase.from("fixed_costs").insert(draft as never);
    if (error) {
      toast.error(error.message);
      return;
    }
    setDraft({ name: "", monthly_amount: 0 });
    invalidate();
  }

  async function patchFixed(id: string, values: Record<string, unknown>) {
    const { error } = await supabase.from("fixed_costs").update(values as never).eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    invalidate();
  }

  async function removeFixed(id: string) {
    const { error } = await supabase.from("fixed_costs").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    invalidate();
  }

  const monthlyTotal = fixedCosts
    .filter((f) => f.active)
    .reduce((s, f) => s + Number(f.monthly_amount), 0);

  return (
    <AppShell
      title="Settings"
      description="Business cost assumptions used for new daily records."
      actions={
        <Button onClick={saveSettings} disabled={saving}>
          <Save className="size-4" /> Save settings
        </Button>
      }
    >
      <div className="space-y-4">
        <Section title="Shipping" description="Per-order shipping assumptions.">
          <div className="grid gap-4 sm:grid-cols-4">
            <NumField
              label="Prepaid shipping / order"
              prefix="₹"
              value={form.prepaid_shipping_cost}
              onChange={set("prepaid_shipping_cost")}
            />
            <NumField
              label="COD shipping / order"
              prefix="₹"
              value={form.cod_shipping_cost}
              onChange={set("cod_shipping_cost")}
            />
            <NumField
              label="RTO shipping / order"
              prefix="₹"
              value={form.rto_shipping_cost}
              onChange={set("rto_shipping_cost")}
              hint="Applied to RTO orders only, separately from delivered shipping."
            />
            <NumField
              label="Return shipping / order"
              prefix="₹"
              value={form.return_shipping_cost}
              onChange={set("return_shipping_cost")}
            />
          </div>
        </Section>

        <Section title="Payment">
          <div className="grid gap-4 sm:grid-cols-3">
            <NumField
              label="Payment gateway"
              suffix="%"
              value={form.payment_gateway_percent}
              onChange={set("payment_gateway_percent")}
              hint="Applied to net revenue."
            />
            <NumField
              label="Fixed payment fee / prepaid order"
              prefix="₹"
              value={form.payment_fixed_fee}
              onChange={set("payment_fixed_fee")}
            />
            <NumField
              label="COD fee / order"
              prefix="₹"
              value={form.cod_fee_per_order}
              onChange={set("cod_fee_per_order")}
            />
          </div>
        </Section>

        <Section
          title="Packaging"
          description="Choose one source of truth so packaging is never counted twice."
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Switch
                id="packaging-mode"
                checked={form.packaging_mode === "per_order"}
                onCheckedChange={(v) =>
                  setForm((f) => ({ ...f, packaging_mode: v ? "per_order" : "product" }))
                }
              />
              <Label htmlFor="packaging-mode" className="text-sm">
                {form.packaging_mode === "per_order"
                  ? "Flat packaging cost per order (product packaging costs ignored)"
                  : "Use each product's packaging cost (per unit)"}
              </Label>
            </div>
            <div className="w-full sm:w-56">
              <NumField
                label="Packaging cost / order"
                prefix="₹"
                value={form.packaging_cost_per_order}
                onChange={set("packaging_cost_per_order")}
              />
            </div>
          </div>
        </Section>

        <Section title="Other variable cost">
          <div className="max-w-xs">
            <NumField
              label="Other variable cost / order"
              prefix="₹"
              value={form.other_variable_cost_per_order}
              onChange={set("other_variable_cost_per_order")}
            />
          </div>
        </Section>

        <Section
          title="Fixed costs"
          description="Monthly overheads. These are never mixed into daily variable costs — reports show operating profit before fixed costs and net profit after."
        >
          <div className="space-y-2">
            {fixedCosts.map((f) => (
              <div
                key={f.id}
                className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-background px-3 py-2"
              >
                <Input
                  defaultValue={f.name}
                  onBlur={(e) => e.target.value !== f.name && patchFixed(f.id, { name: e.target.value })}
                  className="h-9 w-48 bg-card"
                />
                <Input
                  type="number"
                  min={0}
                  defaultValue={Number(f.monthly_amount)}
                  onBlur={(e) => patchFixed(f.id, { monthly_amount: Number(e.target.value || 0) })}
                  className="num h-9 w-36 bg-card text-right"
                />
                {f.is_demo && <Badge variant="secondary">Demo</Badge>}
                <div className="ml-auto flex items-center gap-3">
                  <Switch
                    checked={f.active}
                    onCheckedChange={(v) => patchFixed(f.id, { active: v })}
                  />
                  <Button variant="ghost" size="icon" onClick={() => removeFixed(f.id)}>
                    <Trash2 className="size-4 text-muted-foreground" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap items-end gap-3">
            <Input
              placeholder="Expense name (e.g. Shopify)"
              value={draft.name}
              onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
              className="w-56 bg-background"
            />
            <Input
              type="number"
              min={0}
              placeholder="Monthly amount"
              value={draft.monthly_amount || ""}
              onChange={(e) => setDraft((d) => ({ ...d, monthly_amount: Number(e.target.value || 0) }))}
              className="num w-40 bg-background"
            />
            <Button variant="outline" onClick={addFixed}>
              <Plus className="size-4" /> Add
            </Button>
            <span className="ml-auto text-sm text-muted-foreground">
              Total monthly fixed costs:{" "}
              <span className="num font-semibold text-foreground">{money(monthlyTotal)}</span>
            </span>
          </div>
        </Section>
      </div>
    </AppShell>
  );
}
