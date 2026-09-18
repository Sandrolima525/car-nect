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
          created_at: string
          duration_minutes: number
          id: string
          price: number
          service_id: string
        }
        Insert: {
          appointment_id: string
          created_at?: string
          duration_minutes?: number
          id?: string
          price?: number
          service_id: string
        }
        Update: {
          appointment_id?: string
          created_at?: string
          duration_minutes?: number
          id?: string
          price?: number
          service_id?: string
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
          check_in_at: string | null
          company_id: string
          completed_at: string | null
          created_at: string
          customer_id: string | null
          customer_name: string
          customer_phone: string
          customer_user_id: string | null
          id: string
          notes: string | null
          ready_at: string | null
          service_id: string | null
          source: string
          status: string
          total_duration: number
          total_price: number
          updated_at: string
          vehicle_id: string | null
          vehicle_plate: string | null
          washing_at: string | null
        }
        Insert: {
          appointment_date: string
          appointment_time: string
          check_in_at?: string | null
          company_id: string
          completed_at?: string | null
          created_at?: string
          customer_id?: string | null
          customer_name: string
          customer_phone: string
          customer_user_id?: string | null
          id?: string
          notes?: string | null
          ready_at?: string | null
          service_id?: string | null
          source?: string
          status?: string
          total_duration?: number
          total_price?: number
          updated_at?: string
          vehicle_id?: string | null
          vehicle_plate?: string | null
          washing_at?: string | null
        }
        Update: {
          appointment_date?: string
          appointment_time?: string
          check_in_at?: string | null
          company_id?: string
          completed_at?: string | null
          created_at?: string
          customer_id?: string | null
          customer_name?: string
          customer_phone?: string
          customer_user_id?: string | null
          id?: string
          notes?: string | null
          ready_at?: string | null
          service_id?: string | null
          source?: string
          status?: string
          total_duration?: number
          total_price?: number
          updated_at?: string
          vehicle_id?: string | null
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
          {
            foreignKeyName: "appointments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
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
          brand_colors: Json
          business_hours: Json
          city: string | null
          created_at: string
          currency: string
          document: string | null
          email: string | null
          id: string
          logo_url: string | null
          name: string
          owner_id: string
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
          brand_colors?: Json
          business_hours?: Json
          city?: string | null
          created_at?: string
          currency?: string
          document?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          name: string
          owner_id: string
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
          brand_colors?: Json
          business_hours?: Json
          city?: string | null
          created_at?: string
          currency?: string
          document?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          owner_id?: string
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
          company_id: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          updated_at: string
          workshop_id: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
          workshop_id?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
          workshop_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_workshop_id_fkey"
            columns: ["workshop_id"]
            isOneToOne: false
            referencedRelation: "workshops"
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
      oil_changes: {
        Row: {
          changed_at: string
          created_at: string
          created_by: string | null
          customer_id: string | null
          filter_changed: boolean
          id: string
          mileage: number
          next_change_date: string | null
          next_change_mileage: number | null
          notes: string | null
          oil_brand: string | null
          oil_quantity: number | null
          oil_type: string | null
          oil_viscosity: string | null
          vehicle_id: string
          workshop_id: string
        }
        Insert: {
          changed_at?: string
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          filter_changed?: boolean
          id?: string
          mileage: number
          next_change_date?: string | null
          next_change_mileage?: number | null
          notes?: string | null
          oil_brand?: string | null
          oil_quantity?: number | null
          oil_type?: string | null
          oil_viscosity?: string | null
          vehicle_id: string
          workshop_id: string
        }
        Update: {
          changed_at?: string
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          filter_changed?: boolean
          id?: string
          mileage?: number
          next_change_date?: string | null
          next_change_mileage?: number | null
          notes?: string | null
          oil_brand?: string | null
          oil_quantity?: number | null
          oil_type?: string | null
          oil_viscosity?: string | null
          vehicle_id?: string
          workshop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "oil_changes_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oil_changes_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oil_changes_workshop_id_fkey"
            columns: ["workshop_id"]
            isOneToOne: false
            referencedRelation: "workshops"
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
          payment_method: string
          service_order_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount?: number
          company_id: string
          created_at?: string
          id?: string
          notes?: string | null
          paid_at?: string | null
          payment_method?: string
          service_order_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          company_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          paid_at?: string | null
          payment_method?: string
          service_order_id?: string | null
          status?: string
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
      profiles: {
        Row: {
          active: boolean
          company_id: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          role: string
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
          role?: string
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
          role?: string
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
          appointment_id: string | null
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
          appointment_id?: string | null
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
          appointment_id?: string | null
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
            foreignKeyName: "service_orders_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
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
      user_roles: {
        Row: {
          created_at: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      vehicles: {
        Row: {
          brand: string | null
          category: string
          color: string | null
          company_id: string | null
          created_at: string
          customer_id: string | null
          id: string
          mileage: number | null
          model: string | null
          nfc_tag_uid: string | null
          plate: string | null
          public_token: string
          updated_at: string
          workshop_id: string | null
          year: number | null
        }
        Insert: {
          brand?: string | null
          category?: string
          color?: string | null
          company_id?: string | null
          created_at?: string
          customer_id?: string | null
          id?: string
          mileage?: number | null
          model?: string | null
          nfc_tag_uid?: string | null
          plate?: string | null
          public_token?: string
          updated_at?: string
          workshop_id?: string | null
          year?: number | null
        }
        Update: {
          brand?: string | null
          category?: string
          color?: string | null
          company_id?: string | null
          created_at?: string
          customer_id?: string | null
          id?: string
          mileage?: number | null
          model?: string | null
          nfc_tag_uid?: string | null
          plate?: string | null
          public_token?: string
          updated_at?: string
          workshop_id?: string | null
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
          {
            foreignKeyName: "vehicles_workshop_id_fkey"
            columns: ["workshop_id"]
            isOneToOne: false
            referencedRelation: "workshops"
            referencedColumns: ["id"]
          },
        ]
      }
      workshop_users: {
        Row: {
          created_at: string
          role: string
          user_id: string
          workshop_id: string
        }
        Insert: {
          created_at?: string
          role?: string
          user_id: string
          workshop_id: string
        }
        Update: {
          created_at?: string
          role?: string
          user_id?: string
          workshop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workshop_users_workshop_id_fkey"
            columns: ["workshop_id"]
            isOneToOne: false
            referencedRelation: "workshops"
            referencedColumns: ["id"]
          },
        ]
      }
      workshops: {
        Row: {
          active: boolean
          address: string | null
          city: string | null
          created_at: string
          document: string | null
          email: string | null
          id: string
          name: string
          owner_id: string
          phone: string | null
          state: string | null
          trade_name: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          address?: string | null
          city?: string | null
          created_at?: string
          document?: string | null
          email?: string | null
          id?: string
          name: string
          owner_id: string
          phone?: string | null
          state?: string | null
          trade_name?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          address?: string | null
          city?: string | null
          created_at?: string
          document?: string | null
          email?: string | null
          id?: string
          name?: string
          owner_id?: string
          phone?: string | null
          state?: string | null
          trade_name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_manage_company_logo: {
        Args: { _company_id: string }
        Returns: boolean
      }
      create_public_booking: {
        Args: {
          _date: string
          _name: string
          _notes?: string
          _phone: string
          _service_id: string
          _slug: string
          _time: string
          _vehicle_brand?: string
          _vehicle_model?: string
          _vehicle_plate?: string
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
          _vehicle_category: string
          _vehicle_model?: string
          _vehicle_plate?: string
        }
        Returns: string
      }
      get_public_available_slots: {
        Args: { _date: string; _service_id: string; _slug: string }
        Returns: {
          slot: string
        }[]
      }
      get_public_available_slots_multi: {
        Args: { _date: string; _service_ids: string[]; _slug: string }
        Returns: {
          slot: string
        }[]
      }
      is_platform_admin: { Args: never; Returns: boolean }
      is_workshop_member: { Args: { p_workshop_id: string }; Returns: boolean }
    }
    Enums: {
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
