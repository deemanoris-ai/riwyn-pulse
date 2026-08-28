import { useState } from "react";
import type { ProductStat } from "@/lib/analytics";
import { count, money, pct } from "@/lib/format";
import { cn } from "@/lib/utils";

type SortKey = "contribution" | "units" | "revenue" | "margin";

const SORTS: { key: SortKey; label: string }[] = [
  { key: "contribution", label: "Highest profit" },
  { key: "units", label: "Highest units sold" },
  { key: "revenue", label: "Highest revenue" },
  { key: "margin", label: "Best margin" },
];

export function ProductTable({ products }: { products: ProductStat[] }) {
  const [sort, setSort] = useState<SortKey>("contribution");
  const rows = [...products].sort((a, b) => b[sort] - a[sort]);

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex flex-wrap gap-1 border-b border-border p-3">
        {SORTS.map((s) => (
          <button
            key={s.key}
            onClick={() => setSort(s.key)}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              sort === s.key
                ? "bg-secondary text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {s.label}
          </button>
        ))}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
              <th className="px-4 py-3 font-semibold">Product</th>
              <th className="px-4 py-3 text-right font-semibold">Units</th>
              <th className="px-4 py-3 text-right font-semibold">Revenue</th>
              <th className="px-4 py-3 text-right font-semibold">Product cost</th>
              <th className="px-4 py-3 text-right font-semibold">Printing</th>
              <th className="px-4 py-3 text-right font-semibold">Packaging</th>
              <th className="px-4 py-3 text-right font-semibold">Shipping</th>
              <th className="px-4 py-3 text-right font-semibold">Total cost</th>
              <th className="px-4 py-3 text-right font-semibold">Contribution</th>
              <th className="px-4 py-3 text-right font-semibold">Contr./unit</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={10} className="px-4 py-8 text-center text-muted-foreground">
                  No product sales recorded in this period.
                </td>
              </tr>
            )}
            {rows.map((p) => (
              <tr key={p.name} className="border-b border-border/60 last:border-0">
                <td className="px-4 py-3 font-medium">{p.name}</td>
                <td className="num px-4 py-3 text-right">{count(p.units)}</td>
                <td className="num px-4 py-3 text-right">{money(p.revenue)}</td>
                <td className="num px-4 py-3 text-right">{money(p.productCost)}</td>
                <td className="num px-4 py-3 text-right">{money(p.printing)}</td>
                <td className="num px-4 py-3 text-right">{money(p.packaging)}</td>
                <td className="num px-4 py-3 text-right">{money(p.shipping)}</td>
                <td className="num px-4 py-3 text-right">{money(p.totalCost)}</td>
                <td
                  className={cn(
                    "num px-4 py-3 text-right font-semibold",
                    p.contribution >= 0 ? "text-positive" : "text-negative",
                  )}
                >
                  {money(p.contribution)}
                </td>
                <td className="num px-4 py-3 text-right">
                  {money(p.contributionPerUnit)}
                  <span className="ml-1 text-xs text-muted-foreground">{pct(p.margin, 0)}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
