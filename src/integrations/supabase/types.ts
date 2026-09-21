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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      appointment_services: {
        Row: {
          appointment_id: string
          company_id: string
          created_at: string
          duration_minutes: number
          id: string
          price: number
          service_id: string | null
        }
        Insert: {
          appointment_id: string
          company_id: string
          created_at?: string
          duration_minutes?: number
          id?: string
          price?: number
          service_id?: string | null
        }
        Update: {
          appointment_id?: string
          company_id?: string
          created_at?: string
          duration_minutes?: number
          id?: string
          price?: number
          service_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointment_services_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_services_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          appointment_date: string
          appointment_time: string
          company_id: string
          completed_at: string | null
          created_at: string
          customer_id: string | null
          customer_name: string
          customer_phone: string | null
          customer_user_id: string | null
          id: string
          notes: string | null
          ready_at: string | null
          source: string
          status: string
          total_duration: number
          total_price: number
          updated_at: string
          vehicle_brand: string | null
          vehicle_category: string | null
          vehicle_model: string | null
          vehicle_plate: string | null
          washing_at: string | null
        }
        Insert: {
          appointment_date: string
          appointment_time: string
          company_id: string
          completed_at?: string | null
          created_at?: string
          customer_id?: string | null
          customer_name: string
          customer_phone?: string | null
          customer_user_id?: string | null
          id?: string
          notes?: string | null
          ready_at?: string | null
          source?: string
          status?: string
          total_duration?: number
          total_price?: number
          updated_at?: string
          vehicle_brand?: string | null
          vehicle_category?: string | null
          vehicle_model?: string | null
          vehicle_plate?: string | null
          washing_at?: string | null
        }
        Update: {
          appointment_date?: string
          appointment_time?: string
          company_id?: string
          completed_at?: string | null
          created_at?: string
          customer_id?: string | null
          customer_name?: string
          customer_phone?: string | null
          customer_user_id?: string | null
          id?: string
          notes?: string | null
          ready_at?: string | null
          source?: string
          status?: string
          total_duration?: number
          total_price?: number
          updated_at?: string
          vehicle_brand?: string | null
          vehicle_category?: string | null
          vehicle_model?: string | null
          vehicle_plate?: string | null
          washing_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_blocks: {
        Row: {
          block_date: string
          company_id: string
          created_at: string
          end_time: string
          id: string
          reason: string | null
          start_time: string
        }
        Insert: {
          block_date: string
          company_id: string
          created_at?: string
          end_time: string
          id?: string
          reason?: string | null
          start_time: string
        }
        Update: {
          block_date?: string
          company_id?: string
          created_at?: string
          end_time?: string
          id?: string
          reason?: string | null
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_blocks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          active: boolean
          address: string | null
          booking_interval_minutes: number
          booking_min_advance_minutes: number
          brand_colors: Json | null
          business_hours: Json | null
          city: string | null
          created_at: string
          document: string | null
          email: string | null
          id: string
          logo_url: string | null
          name: string
          phone: string | null
          public_booking_enabled: boolean
          public_booking_slug: string | null
          simultaneous_capacity: number
          state: string | null
          trade_name: string | null
          updated_at: string
          whatsapp_number: string | null
          zip_code: string | null
        }
        Insert: {
          active?: boolean
          address?: string | null
          booking_interval_minutes?: number
          booking_min_advance_minutes?: number
          brand_colors?: Json | null
          business_hours?: Json | null
          city?: string | null
          created_at?: string
          document?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          name: string
          phone?: string | null
          public_booking_enabled?: boolean
          public_booking_slug?: string | null
          simultaneous_capacity?: number
          state?: string | null
          trade_name?: string | null
          updated_at?: string
          whatsapp_number?: string | null
          zip_code?: string | null
        }
        Update: {
          active?: boolean
          address?: string | null
          booking_interval_minutes?: number
          booking_min_advance_minutes?: number
          brand_colors?: Json | null
          business_hours?: Json | null
          city?: string | null
          created_at?: string
          document?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          phone?: string | null
          public_booking_enabled?: boolean
          public_booking_slug?: string | null
          simultaneous_capacity?: number
          state?: string | null
          trade_name?: string | null
          updated_at?: string
          whatsapp_number?: string | null
          zip_code?: string | null
        }
        Relationships: []
      }
      customers: {
        Row: {
          company_id: string
          created_at: string
          document: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          document?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          document?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          active: boolean
          commission_percentage: number
          company_id: string
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string | null
          role: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          commission_percentage?: number
          company_id: string
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          role?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          commission_percentage?: number
          company_id?: string
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          role?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employees_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          company_id: string
          created_at: string
          id: string
          notes: string | null
          paid_at: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          service_order_id: string | null
          status: Database["public"]["Enums"]["payment_status"]
          updated_at: string
        }
        Insert: {
          amount?: number
          company_id: string
          created_at?: string
          id?: string
          notes?: string | null
          paid_at?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          service_order_id?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Update: {
          amount?: number
          company_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          paid_at?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          service_order_id?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_service_order_id_fkey"
            columns: ["service_order_id"]
            isOneToOne: false
            referencedRelation: "service_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_admins: {
        Row: {
          created_at: string
          email: string | null
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          active: boolean
          company_id: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          company_id?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          company_id?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      service_order_items: {
        Row: {
          company_id: string
          created_at: string
          id: string
          quantity: number
          service_id: string | null
          service_order_id: string
          total: number
          unit_price: number
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          quantity?: number
          service_id?: string | null
          service_order_id: string
          total?: number
          unit_price?: number
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          quantity?: number
          service_id?: string | null
          service_order_id?: string
          total?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "service_order_items_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_order_items_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_order_items_service_order_id_fkey"
            columns: ["service_order_id"]
            isOneToOne: false
            referencedRelation: "service_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      service_orders: {
        Row: {
          company_id: string
          completed_at: string | null
          created_at: string
          customer_id: string | null
          discount: number
          employee_id: string | null
          id: string
          mileage: number | null
          notes: string | null
          started_at: string | null
          status: Database["public"]["Enums"]["service_order_status"]
          subtotal: number
          total: number
          updated_at: string
          vehicle_id: string | null
        }
        Insert: {
          company_id: string
          completed_at?: string | null
          created_at?: string
          customer_id?: string | null
          discount?: number
          employee_id?: string | null
          id?: string
          mileage?: number | null
          notes?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["service_order_status"]
          subtotal?: number
          total?: number
          updated_at?: string
          vehicle_id?: string | null
        }
        Update: {
          company_id?: string
          completed_at?: string | null
          created_at?: string
          customer_id?: string | null
          discount?: number
          employee_id?: string | null
          id?: string
          mileage?: number | null
          notes?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["service_order_status"]
          subtotal?: number
          total?: number
          updated_at?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_orders_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_orders_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_orders_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          active: boolean
          category: string | null
          company_id: string
          created_at: string
          description: string | null
          estimated_duration: number | null
          id: string
          name: string
          price: number
          updated_at: string
          vehicle_category: string
        }
        Insert: {
          active?: boolean
          category?: string | null
          company_id: string
          created_at?: string
          description?: string | null
          estimated_duration?: number | null
          id?: string
          name: string
          price?: number
          updated_at?: string
          vehicle_category?: string
        }
        Update: {
          active?: boolean
          category?: string | null
          company_id?: string
          created_at?: string
          description?: string | null
          estimated_duration?: number | null
          id?: string
          name?: string
          price?: number
          updated_at?: string
          vehicle_category?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          brand: string | null
          category: string | null
          color: string | null
          company_id: string
          created_at: string
          customer_id: string
          id: string
          mileage: number | null
          model: string | null
          notes: string | null
          plate: string
          updated_at: string
          year: number | null
        }
        Insert: {
          brand?: string | null
          category?: string | null
          color?: string | null
          company_id: string
          created_at?: string
          customer_id: string
          id?: string
          mileage?: number | null
          model?: string | null
          notes?: string | null
          plate: string
          updated_at?: string
          year?: number | null
        }
        Update: {
          brand?: string | null
          category?: string | null
          color?: string | null
          company_id?: string
          created_at?: string
          customer_id?: string
          id?: string
          mileage?: number | null
          model?: string | null
          notes?: string | null
          plate?: string
          updated_at?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicles_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_create_company: {
        Args: {
          _city?: string
          _document?: string
          _email?: string
          _name: string
          _owner_email?: string
          _phone?: string
          _state?: string
          _trade_name?: string
        }
        Returns: string
      }
      admin_link_user_to_company: {
        Args: {
          _company_id: string
          _email: string
          _role?: Database["public"]["Enums"]["app_role"]
        }
        Returns: undefined
      }
      admin_list_companies: {
        Args: never
        Returns: {
          active: boolean
          appointments_count: number
          city: string
          created_at: string
          customers_count: number
          document: string
          email: string
          id: string
          name: string
          owner_email: string
          phone: string
          public_booking_enabled: boolean
          public_booking_slug: string
          state: string
          trade_name: string
          users_count: number
        }[]
      }
      admin_list_company_users: {
        Args: { _company_id: string }
        Returns: {
          active: boolean
          created_at: string
          email: string
          full_name: string
          profile_id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }[]
      }
      admin_set_company_active: {
        Args: { _active: boolean; _company_id: string }
        Returns: undefined
      }
      admin_unlink_user: { Args: { _profile_id: string }; Returns: undefined }
      admin_update_company: {
        Args: {
          _city?: string
          _company_id: string
          _document?: string
          _email?: string
          _name: string
          _phone?: string
          _public_booking_enabled?: boolean
          _state?: string
          _trade_name?: string
        }
        Returns: undefined
      }
      create_company_for_current_user: {
        Args: {
          _city?: string
          _document?: string
          _email?: string
          _name: string
          _phone?: string
          _state?: string
          _trade_name?: string
        }
        Returns: string
      }
      create_public_booking_multi: {
        Args: {
          _date: string
          _name: string
          _notes?: string
          _phone: string
          _service_ids: string[]
          _slug: string
          _time: string
          _vehicle_brand?: string
          _vehicle_model?: string
          _vehicle_plate?: string
        }
        Returns: string
      }
      create_walk_in_appointment: {
        Args: {
          _company_id: string
          _date: string
          _name: string
          _notes?: string
          _phone: string
          _service_ids: string[]
          _time: string
          _vehicle_brand?: string
          _vehicle_category?: string
          _vehicle_model?: string
          _vehicle_plate?: string
        }
        Returns: string
      }
      current_company_id: { Args: never; Returns: string }
      get_public_available_slots_multi: {
        Args: { _date: string; _service_ids: string[]; _slug: string }
        Returns: {
          slot: string
        }[]
      }
      has_role: {
        Args: { _role: Database["public"]["Enums"]["app_role"] }
        Returns: boolean
      }
      is_company_admin: { Args: never; Returns: boolean }
      is_platform_admin: { Args: never; Returns: boolean }
      manage_company_profile: {
        Args: {
          _active: boolean
          _profile_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: undefined
      }
      user_company_id: { Args: never; Returns: string }
    }
    Enums: {
      app_role: "owner" | "admin" | "manager" | "employee"
      payment_method: "cash" | "pix" | "debit_card" | "credit_card" | "other"
      payment_status: "pending" | "paid" | "cancelled" | "refunded"
      service_order_status:
        | "pending"
        | "in_progress"
        | "completed"
        | "delivered"
        | "cancelled"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["owner", "admin", "manager", "employee"],
      payment_method: ["cash", "pix", "debit_card", "credit_card", "other"],
      payment_status: ["pending", "paid", "cancelled", "refunded"],
      service_order_status: [
        "pending",
        "in_progress",
        "completed",
        "delivered",
        "cancelled",
      ],
    },
  },
} as const
