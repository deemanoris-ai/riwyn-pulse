export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      business_cost_settings: {
        Row: {
          cod_fee_per_order: number
          cod_shipping_cost: number
          created_at: string
          id: string
          include_fixed_costs_in_daily: boolean
          other_variable_cost_per_order: number
          packaging_cost_per_order: number
          packaging_mode: string
          payment_fixed_fee: number
          payment_gateway_percent: number
          prepaid_shipping_cost: number
          return_shipping_cost: number
          rto_shipping_cost: number
          singleton: boolean
          updated_at: string
        }
        Insert: {
          cod_fee_per_order?: number
          cod_shipping_cost?: number
          created_at?: string
          id?: string
          include_fixed_costs_in_daily?: boolean
          other_variable_cost_per_order?: number
          packaging_cost_per_order?: number
          packaging_mode?: string
          payment_fixed_fee?: number
          payment_gateway_percent?: number
          prepaid_shipping_cost?: number
          return_shipping_cost?: number
          rto_shipping_cost?: number
          singleton?: boolean
          updated_at?: string
        }
        Update: {
          cod_fee_per_order?: number
          cod_shipping_cost?: number
          created_at?: string
          id?: string
          include_fixed_costs_in_daily?: boolean
          other_variable_cost_per_order?: number
          packaging_cost_per_order?: number
          packaging_mode?: string
          payment_fixed_fee?: number
          payment_gateway_percent?: number
          prepaid_shipping_cost?: number
          return_shipping_cost?: number
          rto_shipping_cost?: number
          singleton?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      daily_product_sales: {
        Row: {
          created_at: string
          daily_record_id: string
          id: string
          packaging_cost_snapshot: number
          printing_cost_snapshot: number
          product_cost_snapshot: number
          product_id: string | null
          product_name: string
          quantity: number
          selling_price_snapshot: number
        }
        Insert: {
          created_at?: string
          daily_record_id: string
          id?: string
          packaging_cost_snapshot?: number
          printing_cost_snapshot?: number
          product_cost_snapshot?: number
          product_id?: string | null
          product_name?: string
          quantity?: number
          selling_price_snapshot?: number
        }
        Update: {
          created_at?: string
          daily_record_id?: string
          id?: string
          packaging_cost_snapshot?: number
          printing_cost_snapshot?: number
          product_cost_snapshot?: number
          product_id?: string | null
          product_name?: string
          quantity?: number
          selling_price_snapshot?: number
        }
        Relationships: [
          {
            foreignKeyName: "daily_product_sales_daily_record_id_fkey"
            columns: ["daily_record_id"]
            isOneToOne: false
            referencedRelation: "daily_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_product_sales_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_records: {
        Row: {
          agency_spend: number
          cancelled_orders: number
          cod_orders: number
          cost_snapshot: Json
          created_at: string
          date: string
          delivered_orders: number
          discounts: number
          gross_sales: number
          id: string
          influencer_spend: number
          is_demo: boolean
          meta_spend: number
          notes: string | null
          orders: number
          other_marketing_spend: number
          refunds: number
          rto_orders: number
          sessions: number
          shipping_charged: number
          updated_at: string
        }
        Insert: {
          agency_spend?: number
          cancelled_orders?: number
          cod_orders?: number
          cost_snapshot?: Json
          created_at?: string
          date: string
          delivered_orders?: number
          discounts?: number
          gross_sales?: number
          id?: string
          influencer_spend?: number
          is_demo?: boolean
          meta_spend?: number
          notes?: string | null
          orders?: number
          other_marketing_spend?: number
          refunds?: number
          rto_orders?: number
          sessions?: number
          shipping_charged?: number
          updated_at?: string
        }
        Update: {
          agency_spend?: number
          cancelled_orders?: number
          cod_orders?: number
          cost_snapshot?: Json
          created_at?: string
          date?: string
          delivered_orders?: number
          discounts?: number
          gross_sales?: number
          id?: string
          influencer_spend?: number
          is_demo?: boolean
          meta_spend?: number
          notes?: string | null
          orders?: number
          other_marketing_spend?: number
          refunds?: number
          rto_orders?: number
          sessions?: number
          shipping_charged?: number
          updated_at?: string
        }
        Relationships: []
      }
      fixed_costs: {
        Row: {
          active: boolean
          created_at: string
          id: string
          is_demo: boolean
          monthly_amount: number
          name: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          is_demo?: boolean
          monthly_amount?: number
          name: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          is_demo?: boolean
          monthly_amount?: number
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          active: boolean
          created_at: string
          id: string
          is_demo: boolean
          name: string
          packaging_cost: number
          printing_cost: number
          product_cost: number
          selling_price: number
          sku: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          is_demo?: boolean
          name: string
          packaging_cost?: number
          printing_cost?: number
          product_cost?: number
          selling_price?: number
          sku?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          is_demo?: boolean
          name?: string
          packaging_cost?: number
          printing_cost?: number
          product_cost?: number
          selling_price?: number
          sku?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
