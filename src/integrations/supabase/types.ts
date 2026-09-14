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
      audit_log: {
        Row: {
          action: string
          actor: string | null
          created_at: string
          detail: string | null
          entity: string | null
          entity_id: string | null
          id: string
        }
        Insert: {
          action: string
          actor?: string | null
          created_at?: string
          detail?: string | null
          entity?: string | null
          entity_id?: string | null
          id?: string
        }
        Update: {
          action?: string
          actor?: string | null
          created_at?: string
          detail?: string | null
          entity?: string | null
          entity_id?: string | null
          id?: string
        }
        Relationships: []
      }
      commits: {
        Row: {
          author: string | null
          branch: string | null
          committed_at: string | null
          created_at: string
          id: string
          message: string | null
          sha: string
          task_ref: string | null
          url: string | null
        }
        Insert: {
          author?: string | null
          branch?: string | null
          committed_at?: string | null
          created_at?: string
          id?: string
          message?: string | null
          sha: string
          task_ref?: string | null
          url?: string | null
        }
        Update: {
          author?: string | null
          branch?: string | null
          committed_at?: string | null
          created_at?: string
          id?: string
          message?: string | null
          sha?: string
          task_ref?: string | null
          url?: string | null
        }
        Relationships: []
      }
      daily_logs: {
        Row: {
          blockers: string | null
          created_at: string
          did: string | null
          hours: number | null
          id: string
          log_date: string
          next_plan: string | null
          user_id: string
        }
        Insert: {
          blockers?: string | null
          created_at?: string
          did?: string | null
          hours?: number | null
          id?: string
          log_date?: string
          next_plan?: string | null
          user_id: string
        }
        Update: {
          blockers?: string | null
          created_at?: string
          did?: string | null
          hours?: number | null
          id?: string
          log_date?: string
          next_plan?: string | null
          user_id?: string
        }
        Relationships: []
      }
      integrations: {
        Row: {
          config: Json
          enabled: boolean
          id: string
          kind: string
          last_status: string | null
          last_sync_at: string | null
          updated_at: string
        }
        Insert: {
          config?: Json
          enabled?: boolean
          id?: string
          kind: string
          last_status?: string | null
          last_sync_at?: string | null
          updated_at?: string
        }
        Update: {
          config?: Json
          enabled?: boolean
          id?: string
          kind?: string
          last_status?: string | null
          last_sync_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      market_digests: {
        Row: {
          body: string
          created_at: string
          created_by: string | null
          headline: string
          id: string
          model: string | null
          status: string
        }
        Insert: {
          body: string
          created_at?: string
          created_by?: string | null
          headline: string
          id?: string
          model?: string | null
          status?: string
        }
        Update: {
          body?: string
          created_at?: string
          created_by?: string | null
          headline?: string
          id?: string
          model?: string | null
          status?: string
        }
        Relationships: []
      }
      market_notes: {
        Row: {
          capability: string | null
          competitor: string
          id: string
          is_differentiator: boolean
          note: string | null
          our_position: string | null
          their_position: string | null
          updated_at: string
        }
        Insert: {
          capability?: string | null
          competitor: string
          id?: string
          is_differentiator?: boolean
          note?: string | null
          our_position?: string | null
          their_position?: string | null
          updated_at?: string
        }
        Update: {
          capability?: string | null
          competitor?: string
          id?: string
          is_differentiator?: boolean
          note?: string | null
          our_position?: string | null
          their_position?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      phases: {
        Row: {
          created_at: string
          exit_test: string | null
          gate_cleared: boolean
          id: string
          number: number
          scope: string | null
          start_date: string | null
          status: string
          target_date: string | null
          title: string
        }
        Insert: {
          created_at?: string
          exit_test?: string | null
          gate_cleared?: boolean
          id?: string
          number: number
          scope?: string | null
          start_date?: string | null
          status?: string
          target_date?: string | null
          title: string
        }
        Update: {
          created_at?: string
          exit_test?: string | null
          gate_cleared?: boolean
          id?: string
          number?: number
          scope?: string | null
          start_date?: string | null
          status?: string
          target_date?: string | null
          title?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
        }
        Relationships: []
      }
      reminders: {
        Row: {
          channel: string
          created_at: string
          error: string | null
          id: string
          message: string
          send_at: string
          sent_at: string | null
          status: string
          task_id: string | null
          user_id: string
        }
        Insert: {
          channel?: string
          created_at?: string
          error?: string | null
          id?: string
          message: string
          send_at: string
          sent_at?: string | null
          status?: string
          task_id?: string | null
          user_id: string
        }
        Update: {
          channel?: string
          created_at?: string
          error?: string | null
          id?: string
          message?: string
          send_at?: string
          sent_at?: string | null
          status?: string
          task_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reminders_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_events: {
        Row: {
          actor: string | null
          created_at: string
          detail: string | null
          id: string
          kind: string
          task_id: string
        }
        Insert: {
          actor?: string | null
          created_at?: string
          detail?: string | null
          id?: string
          kind: string
          task_id: string
        }
        Update: {
          actor?: string | null
          created_at?: string
          detail?: string | null
          id?: string
          kind?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_events_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assignee: string | null
          blocked_reason: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          estimate_hours: number | null
          id: string
          kanban_status: string
          phase_id: string | null
          position: number
          priority: string
          ref: string
          sdlc_stage: string
          title: string
          updated_at: string
        }
        Insert: {
          assignee?: string | null
          blocked_reason?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          estimate_hours?: number | null
          id?: string
          kanban_status?: string
          phase_id?: string | null
          position?: number
          priority?: string
          ref?: string
          sdlc_stage?: string
          title: string
          updated_at?: string
        }
        Update: {
          assignee?: string | null
          blocked_reason?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          estimate_hours?: number | null
          id?: string
          kanban_status?: string
          phase_id?: string | null
          position?: number
          priority?: string
          ref?: string
          sdlc_stage?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_phase_id_fkey"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "phases"
            referencedColumns: ["id"]
          },
        ]
      }
      use_cases: {
        Row: {
          buyer: string | null
          documents: string | null
          gate: string | null
          id: string
          name: string
          notes: string | null
          rank: number
          status: string
          wave: number | null
          why_fits: string | null
        }
        Insert: {
          buyer?: string | null
          documents?: string | null
          gate?: string | null
          id?: string
          name: string
          notes?: string | null
          rank: number
          status?: string
          wave?: number | null
          why_fits?: string | null
        }
        Update: {
          buyer?: string | null
          documents?: string | null
          gate?: string | null
          id?: string
          name?: string
          notes?: string | null
          rank?: number
          status?: string
          wave?: number | null
          why_fits?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_manage: { Args: { _user_id: string }; Returns: boolean }
      can_write: { Args: { _user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "owner" | "manager" | "contributor" | "viewer"
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
      app_role: ["owner", "manager", "contributor", "viewer"],
    },
  },
} as const
