const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const inr2 = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const num = new Intl.NumberFormat("en-IN");

export function money(value: number | null | undefined, decimals = false): string {
  const v = Number.isFinite(value as number) ? (value as number) : 0;
  return decimals ? inr2.format(v) : inr.format(Math.round(v));
}

export function count(value: number | null | undefined): string {
  const v = Number.isFinite(value as number) ? (value as number) : 0;
  return num.format(v);
}

export function pct(value: number | null | undefined, digits = 1): string {
  const v = Number.isFinite(value as number) ? (value as number) : 0;
  return `${v.toFixed(digits)}%`;
}

export function ratio(value: number | null | undefined, digits = 2): string {
  const v = Number.isFinite(value as number) ? (value as number) : 0;
  return `${v.toFixed(digits)}x`;
}

export function delta(current: number, previous: number): number | null {
  if (!Number.isFinite(previous) || previous === 0) return null;
  return ((current - previous) / Math.abs(previous)) * 100;
}

export function toISODate(d: Date): string {
  const tz = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return tz.toISOString().slice(0, 10);
}

export function prettyDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y!, (m ?? 1) - 1, d ?? 1).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function shortDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y!, (m ?? 1) - 1, d ?? 1).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });
}
