import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useInvalidateAll, useProducts, type Product } from "@/lib/db";
import { money } from "@/lib/format";

export const Route = createFileRoute("/products")({
  head: () => ({
    meta: [
      { title: "Products & Costs — RǏWYÑ Profit OS" },
      {
        name: "description",
        content: "Manage RǏWYÑ product selling prices, manufacturing, printing and packaging costs.",
      },
      { property: "og:title", content: "Products & Costs — RǏWYÑ Profit OS" },
      {
        property: "og:description",
        content: "Your editable cost library — the base for every profit calculation.",
      },
    ],
  }),
  component: ProductsPage,
});

const BLANK = {
  name: "",
  sku: "",
  selling_price: 0,
  product_cost: 0,
  printing_cost: 0,
  packaging_cost: 0,
  active: true,
};

function ProductsPage() {
  const { data: products = [], isLoading } = useProducts();
  const invalidate = useInvalidateAll();
  const [draft, setDraft] = useState({ ...BLANK });
  const [busy, setBusy] = useState(false);

  async function addProduct() {
    if (!draft.name.trim()) {
      toast.error("Give the product a name.");
      return;
    }
    setBusy(true);
    const { error } = await supabase
      .from("products")
      .insert({ ...draft, sku: draft.sku || null } as never);
    setBusy(false);
    if (error) return toast.error(error.message);
    setDraft({ ...BLANK });
    invalidate();
    toast.success("Product added.");
  }

  async function patch(id: string, values: Partial<Product>) {
    const { error } = await supabase.from("products").update(values as never).eq("id", id);
    if (error) return toast.error(error.message);
    invalidate();
  }

  async function remove(id: string) {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) return toast.error(error.message);
    invalidate();
    toast.success("Product deleted. Past daily records keep their snapshotted costs.");
  }

  return (
    <AppShell
      title="Products & Costs"
      description="Edit costs freely — saved daily records keep the costs that were in effect when they were saved."
    >
      <div className="rounded-xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3 font-semibold">Product</th>
                <th className="px-4 py-3 font-semibold">SKU</th>
                <th className="px-4 py-3 text-right font-semibold">Selling price</th>
                <th className="px-4 py-3 text-right font-semibold">Product cost</th>
                <th className="px-4 py-3 text-right font-semibold">Printing</th>
                <th className="px-4 py-3 text-right font-semibold">Packaging</th>
                <th className="px-4 py-3 text-right font-semibold">Contribution</th>
                <th className="px-4 py-3 text-center font-semibold">Active</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">
                    Loading…
                  </td>
                </tr>
              )}
              {products.map((p) => {
                const contribution =
                  Number(p.selling_price) -
                  Number(p.product_cost) -
                  Number(p.printing_cost) -
                  Number(p.packaging_cost);
                return (
                  <tr key={p.id} className="border-b border-border/60 last:border-0">
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <Input
                          defaultValue={p.name}
                          onBlur={(e) =>
                            e.target.value !== p.name && patch(p.id, { name: e.target.value })
                          }
                          className="h-9 w-48 bg-background"
                        />
                        {p.is_demo && <Badge variant="secondary">Demo</Badge>}
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <Input
                        defaultValue={p.sku ?? ""}
                        onBlur={(e) =>
                          e.target.value !== (p.sku ?? "") && patch(p.id, { sku: e.target.value })
                        }
                        className="h-9 w-32 bg-background"
                      />
                    </td>
                    {(
                      [
                        "selling_price",
                        "product_cost",
                        "printing_cost",
                        "packaging_cost",
                      ] as const
                    ).map((field) => (
                      <td key={field} className="px-4 py-2 text-right">
                        <Input
                          type="number"
                          min={0}
                          defaultValue={Number(p[field])}
                          onBlur={(e) => {
                            const v = Number(e.target.value || 0);
                            if (v !== Number(p[field])) patch(p.id, { [field]: v } as Partial<Product>);
                          }}
                          className="num h-9 w-28 bg-background text-right"
                        />
                      </td>
                    ))}
                    <td
                      className={`num px-4 py-2 text-right font-semibold ${
                        contribution >= 0 ? "text-positive" : "text-negative"
                      }`}
                    >
                      {money(contribution)}
                    </td>
                    <td className="px-4 py-2 text-center">
                      <Switch
                        checked={p.active}
                        onCheckedChange={(v) => patch(p.id, { active: v })}
                      />
                    </td>
                    <td className="px-4 py-2 text-right">
                      <Button variant="ghost" size="icon" onClick={() => remove(p.id)}>
                        <Trash2 className="size-4 text-muted-foreground" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider">Add product</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <Input
            placeholder="Product name"
            value={draft.name}
            onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
            className="bg-background lg:col-span-2"
          />
          <Input
            placeholder="SKU (optional)"
            value={draft.sku}
            onChange={(e) => setDraft((d) => ({ ...d, sku: e.target.value }))}
            className="bg-background"
          />
          {(
            [
              ["selling_price", "Selling price"],
              ["product_cost", "Product cost"],
              ["printing_cost", "Printing"],
              ["packaging_cost", "Packaging"],
            ] as const
          ).map(([key, label]) => (
            <Input
              key={key}
              type="number"
              min={0}
              placeholder={label}
              value={draft[key] || ""}
              onChange={(e) => setDraft((d) => ({ ...d, [key]: Number(e.target.value || 0) }))}
              className="num bg-background"
            />
          ))}
        </div>
        <Button className="mt-4" onClick={addProduct} disabled={busy}>
          <Plus className="size-4" /> Add product
        </Button>
      </div>
    </AppShell>
  );
}
