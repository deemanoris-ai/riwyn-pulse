import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  DEFAULT_SETTINGS,
  computeDay,
  n,
  type CostSettings,
  type DayMetrics,
  type ProductLine,
} from "./calc";

export interface Product {
  id: string;
  name: string;
  sku: string | null;
  selling_price: number;
  product_cost: number;
  printing_cost: number;
  packaging_cost: number;
  active: boolean;
  is_demo: boolean;
}

export interface FixedCost {
  id: string;
  name: string;
  monthly_amount: number;
  active: boolean;
  is_demo: boolean;
}

export interface DailySaleRow {
  id: string;
  product_id: string | null;
  product_name: string;
  quantity: number;
  selling_price_snapshot: number;
  product_cost_snapshot: number;
  printing_cost_snapshot: number;
  packaging_cost_snapshot: number;
}

export interface DailyRow {
  id: string;
  date: string;
  gross_sales: number;
  discounts: number;
  refunds: number;
  shipping_charged: number;
  sessions: number;
  orders: number;
  delivered_orders: number;
  cancelled_orders: number;
  rto_orders: number;
  cod_orders: number;
  meta_spend: number;
  agency_spend: number;
  influencer_spend: number;
  other_marketing_spend: number;
  notes: string | null;
  is_demo: boolean;
  cost_snapshot: Record<string, unknown>;
  daily_product_sales: DailySaleRow[];
}

export function snapshotToSettings(
  snapshot: Record<string, unknown> | null | undefined,
  fallback: CostSettings,
): CostSettings {
  if (!snapshot || Object.keys(snapshot).length === 0) return fallback;
  const s = snapshot as Record<string, unknown>;
  return {
    prepaid_shipping_cost: n(s["prepaid_shipping_cost"]),
    cod_shipping_cost: n(s["cod_shipping_cost"]),
    rto_shipping_cost: n(s["rto_shipping_cost"]),
    return_shipping_cost: n(s["return_shipping_cost"]),
    payment_gateway_percent: n(s["payment_gateway_percent"]),
    payment_fixed_fee: n(s["payment_fixed_fee"]),
    cod_fee_per_order: n(s["cod_fee_per_order"]),
    packaging_mode: (s["packaging_mode"] as CostSettings["packaging_mode"]) ?? "product",
    packaging_cost_per_order: n(s["packaging_cost_per_order"]),
    other_variable_cost_per_order: n(s["other_variable_cost_per_order"]),
  };
}

export function linesOf(row: DailyRow): ProductLine[] {
  return (row.daily_product_sales ?? []).map((l) => ({
    product_id: l.product_id,
    product_name: l.product_name,
    quantity: n(l.quantity),
    selling_price: n(l.selling_price_snapshot),
    product_cost: n(l.product_cost_snapshot),
    printing_cost: n(l.printing_cost_snapshot),
    packaging_cost: n(l.packaging_cost_snapshot),
  }));
}

export function metricsOf(row: DailyRow, fallback: CostSettings): DayMetrics {
  return computeDay(
    {
      date: row.date,
      gross_sales: n(row.gross_sales),
      discounts: n(row.discounts),
      refunds: n(row.refunds),
      shipping_charged: n(row.shipping_charged),
      sessions: n(row.sessions),
      orders: n(row.orders),
      delivered_orders: n(row.delivered_orders),
      cancelled_orders: n(row.cancelled_orders),
      rto_orders: n(row.rto_orders),
      cod_orders: n(row.cod_orders),
      meta_spend: n(row.meta_spend),
      agency_spend: n(row.agency_spend),
      influencer_spend: n(row.influencer_spend),
      other_marketing_spend: n(row.other_marketing_spend),
    },
    linesOf(row),
    snapshotToSettings(row.cost_snapshot, fallback),
  );
}

/* ------------- queries ------------- */

export function useProducts() {
  return useQuery({
    queryKey: ["products"],
    queryFn: async (): Promise<Product[]> => {
      const { data, error } = await supabase.from("products").select("*").order("name");
      if (error) throw error;
      return (data ?? []) as unknown as Product[];
    },
  });
}

export function useSettings() {
  return useQuery({
    queryKey: ["settings"],
    queryFn: async (): Promise<CostSettings & { id: string | null }> => {
      const { data, error } = await supabase
        .from("business_cost_settings")
        .select("*")
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      if (!data) return { ...DEFAULT_SETTINGS, id: null };
      const d = data as unknown as Record<string, unknown>;
      return { ...snapshotToSettings(d, DEFAULT_SETTINGS), id: String(d["id"]) };
    },
  });
}

export function useFixedCosts() {
  return useQuery({
    queryKey: ["fixed_costs"],
    queryFn: async (): Promise<FixedCost[]> => {
      const { data, error } = await supabase.from("fixed_costs").select("*").order("created_at");
      if (error) throw error;
      return (data ?? []) as unknown as FixedCost[];
    },
  });
}

export function useDailyRecords() {
  return useQuery({
    queryKey: ["daily_records"],
    queryFn: async (): Promise<DailyRow[]> => {
      const { data, error } = await supabase
        .from("daily_records")
        .select("*, daily_product_sales(*)")
        .order("date", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as DailyRow[];
    },
  });
}

export function useInvalidateAll() {
  const qc = useQueryClient();
  return () => {
    void qc.invalidateQueries({ queryKey: ["daily_records"] });
    void qc.invalidateQueries({ queryKey: ["products"] });
    void qc.invalidateQueries({ queryKey: ["settings"] });
    void qc.invalidateQueries({ queryKey: ["fixed_costs"] });
  };
}

export interface SaveDailyPayload {
  record: Omit<DailyRow, "id" | "daily_product_sales" | "is_demo" | "cost_snapshot">;
  lines: { product_id: string; quantity: number }[];
  products: Product[];
  settings: CostSettings;
}

export function useSaveDaily() {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: async ({ record, lines, products, settings }: SaveDailyPayload) => {
      const snapshot: Record<string, unknown> = { ...settings };
      const { data: saved, error } = await supabase
        .from("daily_records")
        .upsert(
          { ...record, is_demo: false, cost_snapshot: snapshot } as never,
          { onConflict: "date" },
        )
        .select("id")
        .single();
      if (error) throw error;
      const id = (saved as unknown as { id: string }).id;

      const { error: delError } = await supabase
        .from("daily_product_sales")
        .delete()
        .eq("daily_record_id", id);
      if (delError) throw delError;

      const rows = lines
        .filter((l) => l.quantity > 0)
        .map((l) => {
          const p = products.find((x) => x.id === l.product_id);
          return {
            daily_record_id: id,
            product_id: l.product_id,
            product_name: p?.name ?? "",
            quantity: l.quantity,
            selling_price_snapshot: p?.selling_price ?? 0,
            product_cost_snapshot: p?.product_cost ?? 0,
            printing_cost_snapshot: p?.printing_cost ?? 0,
            packaging_cost_snapshot: p?.packaging_cost ?? 0,
          };
        });
      if (rows.length) {
        const { error: insError } = await supabase
          .from("daily_product_sales")
          .insert(rows as never);
        if (insError) throw insError;
      }
      return id;
    },
    onSuccess: invalidate,
  });
}
