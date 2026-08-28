import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Info, TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { money, pct } from "@/lib/format";

export interface BreakdownLine {
  label: string;
  value: number;
  sign?: "+" | "-" | "=";
}

export function Breakdown({ lines }: { lines: BreakdownLine[] }) {
  return (
    <div className="space-y-1.5 text-sm">
      {lines.map((l, i) => (
        <div
          key={i}
          className={cn(
            "flex items-center justify-between gap-6",
            l.sign === "=" && "mt-2 border-t border-border pt-2 font-semibold",
          )}
        >
          <span className="text-muted-foreground">
            {l.sign && l.sign !== "=" ? `${l.sign} ` : ""}
            {l.label}
          </span>
          <span className="num">{money(l.value)}</span>
        </div>
      ))}
    </div>
  );
}

export function KpiCard({
  label,
  value,
  sub,
  tone = "neutral",
  changePct,
  breakdown,
  breakdownTitle,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "neutral" | "profit" | "loss";
  changePct?: number | null;
  breakdown?: BreakdownLine[];
  breakdownTitle?: string;
}) {
  const up = (changePct ?? 0) >= 0;
  return (
    <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        {breakdown && breakdown.length > 0 && (
          <Popover>
            <PopoverTrigger
              aria-label={`View calculation for ${label}`}
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              <Info className="size-3.5" />
            </PopoverTrigger>
            <PopoverContent align="end" className="w-72">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {breakdownTitle ?? `How ${label} is calculated`}
              </p>
              <Breakdown lines={breakdown} />
            </PopoverContent>
          </Popover>
        )}
      </div>
      <div
        className={cn(
          "kpi-value mt-2 text-2xl sm:text-[1.75rem]",
          tone === "profit" && "text-positive",
          tone === "loss" && "text-negative",
        )}
      >
        {value}
      </div>
      <div className="mt-1.5 flex items-center gap-2 text-xs">
        {typeof changePct === "number" && Number.isFinite(changePct) && (
          <span
            className={cn(
              "inline-flex items-center gap-1 font-medium",
              up ? "text-positive" : "text-negative",
            )}
          >
            {up ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
            {pct(Math.abs(changePct))}
          </span>
        )}
        {sub && <span className="text-muted-foreground">{sub}</span>}
      </div>
    </div>
  );
}
