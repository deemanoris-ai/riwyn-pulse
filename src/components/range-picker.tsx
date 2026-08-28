import { RANGE_LABELS, type DateRange, type RangeKey, resolveRange } from "@/lib/range";
import { cn } from "@/lib/utils";

const KEYS: RangeKey[] = ["today", "yesterday", "7d", "30d", "month", "custom"];

export function RangePicker({
  range,
  onChange,
}: {
  range: DateRange;
  onChange: (r: DateRange) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex flex-wrap gap-1 rounded-lg border border-border bg-card p-1">
        {KEYS.map((k) => (
          <button
            key={k}
            onClick={() => onChange(resolveRange(k, range.from, range.to))}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              range.key === k
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground",
            )}
          >
            {RANGE_LABELS[k]}
          </button>
        ))}
      </div>
      {range.key === "custom" && (
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={range.from}
            onChange={(e) => onChange({ ...range, from: e.target.value })}
            className="h-9 rounded-md border border-input bg-card px-2 text-xs"
          />
          <span className="text-xs text-muted-foreground">to</span>
          <input
            type="date"
            value={range.to}
            onChange={(e) => onChange({ ...range, to: e.target.value })}
            className="h-9 rounded-md border border-input bg-card px-2 text-xs"
          />
        </div>
      )}
    </div>
  );
}
