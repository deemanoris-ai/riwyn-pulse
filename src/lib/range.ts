import { toISODate } from "./format";

export type RangeKey = "today" | "yesterday" | "7d" | "30d" | "month" | "custom";

export interface DateRange {
  from: string;
  to: string;
  key: RangeKey;
}

export const RANGE_LABELS: Record<RangeKey, string> = {
  today: "Today",
  yesterday: "Yesterday",
  "7d": "Last 7 Days",
  "30d": "Last 30 Days",
  month: "This Month",
  custom: "Custom",
};

function shift(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

export function resolveRange(key: RangeKey, from?: string, to?: string): DateRange {
  const today = toISODate(new Date());
  switch (key) {
    case "today":
      return { key, from: today, to: today };
    case "yesterday": {
      const y = toISODate(shift(-1));
      return { key, from: y, to: y };
    }
    case "7d":
      return { key, from: toISODate(shift(-6)), to: today };
    case "30d":
      return { key, from: toISODate(shift(-29)), to: today };
    case "month": {
      const d = new Date();
      return { key, from: toISODate(new Date(d.getFullYear(), d.getMonth(), 1)), to: today };
    }
    default:
      return { key: "custom", from: from ?? toISODate(shift(-6)), to: to ?? today };
  }
}

/** Previous equivalent period, immediately preceding `range`. */
export function previousRange(range: DateRange): DateRange {
  const from = new Date(range.from);
  const to = new Date(range.to);
  const days = Math.round((to.getTime() - from.getTime()) / 86400000) + 1;
  const prevTo = new Date(from);
  prevTo.setDate(prevTo.getDate() - 1);
  const prevFrom = new Date(prevTo);
  prevFrom.setDate(prevFrom.getDate() - (days - 1));
  return { key: "custom", from: toISODate(prevFrom), to: toISODate(prevTo) };
}

export function inRange(date: string, range: DateRange): boolean {
  return date >= range.from && date <= range.to;
}
