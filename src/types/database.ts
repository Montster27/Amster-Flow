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
    PostgrestVersion: "13.0.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      interview_assumption_tags: {
        Row: {
          assumption_id: string
          confidence_change: number
          created_at: string | null
          id: string
          interview_id: string
          supporting_quote: string | null
          validation_effect: string
        }
        Insert: {
          assumption_id: string
          confidence_change: number
          created_at?: string | null
          id?: string
          interview_id: string
          supporting_quote?: string | null
          validation_effect: string
        }
        Update: {
          assumption_id?: string
          confidence_change?: number
          created_at?: string | null
          id?: string
          interview_id?: string
          supporting_quote?: string | null
          validation_effect?: string
        }
        Relationships: [
          {
            foreignKeyName: "interview_assumption_tags_assumption_id_fkey"
            columns: ["assumption_id"]
            isOneToOne: false
            referencedRelation: "project_assumptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interview_assumption_tags_interview_id_fkey"
            columns: ["interview_id"]
            isOneToOne: false
            referencedRelation: "project_interviews_enhanced"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_synthesis: {
        Row: {
          assumption_summaries: Json | null
          created_at: string | null
          created_by: string | null
          date_range_end: string
          date_range_start: string
          id: string
          interview_ids: string[]
          most_discussed_segments: string[] | null
          most_invalidated_assumption: string | null
          most_mentioned_pain_point: string | null
          project_id: string
        }
        Insert: {
          assumption_summaries?: Json | null
          created_at?: string | null
          created_by?: string | null
          date_range_end: string
          date_range_start: string
          id?: string
          interview_ids: string[]
          most_discussed_segments?: string[] | null
          most_invalidated_assumption?: string | null
          most_mentioned_pain_point?: string | null
          project_id: string
        }
        Update: {
          assumption_summaries?: Json | null
          created_at?: string | null
          created_by?: string | null
          date_range_end?: string
          date_range_start?: string
          id?: string
          interview_ids?: string[]
          most_discussed_segments?: string[] | null
          most_invalidated_assumption?: string | null
          most_mentioned_pain_point?: string | null
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "interview_synthesis_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interview_synthesis_most_invalidated_assumption_fkey"
            columns: ["most_invalidated_assumption"]
            isOneToOne: false
            referencedRelation: "project_assumptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interview_synthesis_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          id: string
          joined_at: string | null
          organization_id: string
          role: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string | null
          organization_id: string
          role: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string | null
          organization_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organizations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          is_admin: boolean
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          is_admin?: boolean
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          is_admin?: boolean
          updated_at?: string | null
        }
        Relationships: []
      }
      project_assumptions: {
        Row: {
          confidence: number | null
          created_at: string | null
          created_by: string | null
          description: string
          evidence: string[] | null
          id: string
          project_id: string
          status: string
          type: string
          updated_at: string | null
        }
        Insert: {
          confidence?: number | null
          created_at?: string | null
          created_by?: string | null
          description: string
          evidence?: string[] | null
          id?: string
          project_id: string
          status: string
          type: string
          updated_at?: string | null
        }
        Update: {
          confidence?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string
          evidence?: string[] | null
          id?: string
          project_id?: string
          status?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_assumptions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_assumptions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_competitors: {
        Row: {
          created_at: string | null
          created_by: string | null
          customers: string[] | null
          description: string | null
          id: string
          industry_customers: string | null
          name: string
          project_id: string
          supplier_companies: string | null
          suppliers: string[] | null
          technical_regulatory_change: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          customers?: string[] | null
          description?: string | null
          id?: string
          industry_customers?: string | null
          name: string
          project_id: string
          supplier_companies?: string | null
          suppliers?: string[] | null
          technical_regulatory_change?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          customers?: string[] | null
          description?: string | null
          id?: string
          industry_customers?: string | null
          name?: string
          project_id?: string
          supplier_companies?: string | null
          suppliers?: string[] | null
          technical_regulatory_change?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_competitors_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_competitors_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_decision_makers: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          influence: string | null
          project_id: string
          role: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          influence?: string | null
          project_id: string
          role: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          influence?: string | null
          project_id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_decision_makers_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_decision_makers_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_first_target: {
        Row: {
          company_size: string | null
          created_at: string | null
          customer_type: string | null
          description: string | null
          id: string
          location: string | null
          other_influencers: string | null
          project_id: string
          updated_at: string | null
          updated_by: string | null
          who_has_budget: string | null
          who_will_use: string | null
        }
        Insert: {
          company_size?: string | null
          created_at?: string | null
          customer_type?: string | null
          description?: string | null
          id?: string
          location?: string | null
          other_influencers?: string | null
          project_id: string
          updated_at?: string | null
          updated_by?: string | null
          who_has_budget?: string | null
          who_will_use?: string | null
        }
        Update: {
          company_size?: string | null
          created_at?: string | null
          customer_type?: string | null
          description?: string | null
          id?: string
          location?: string | null
          other_influencers?: string | null
          project_id?: string
          updated_at?: string | null
          updated_by?: string | null
          who_has_budget?: string | null
          who_will_use?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_first_target_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_first_target_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      project_interviews: {
        Row: {
          assumptions_addressed: string[] | null
          created_at: string | null
          created_by: string | null
          customer_segment: string
          date: string
          duration: number | null
          follow_up_needed: boolean | null
          format: string | null
          id: string
          interviewee: string | null
          interviewee_type: string | null
          key_insights: string[] | null
          next_action: string | null
          notes: string
          project_id: string
          surprises: string | null
          updated_at: string | null
        }
        Insert: {
          assumptions_addressed?: string[] | null
          created_at?: string | null
          created_by?: string | null
          customer_segment: string
          date: string
          duration?: number | null
          follow_up_needed?: boolean | null
          format?: string | null
          id?: string
          interviewee?: string | null
          interviewee_type?: string | null
          key_insights?: string[] | null
          next_action?: string | null
          notes: string
          project_id: string
          surprises?: string | null
          updated_at?: string | null
        }
        Update: {
          assumptions_addressed?: string[] | null
          created_at?: string | null
          created_by?: string | null
          customer_segment?: string
          date?: string
          duration?: number | null
          follow_up_needed?: boolean | null
          format?: string | null
          id?: string
          interviewee?: string | null
          interviewee_type?: string | null
          key_insights?: string[] | null
          next_action?: string | null
          notes?: string
          project_id?: string
          surprises?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_interviews_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_interviews_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_interviews_enhanced: {
        Row: {
          context: string
          created_at: string | null
          created_by: string | null
          current_alternatives: string
          id: string
          interview_date: string
          interviewee_type: string
          main_pain_points: string
          memorable_quotes: string[] | null
          mentor_feedback: string | null
          problem_importance: number
          problem_importance_quote: string | null
          project_id: string
          segment_name: string
          status: string
          student_reflection: string | null
          surprising_feedback: string | null
          updated_at: string | null
        }
        Insert: {
          context: string
          created_at?: string | null
          created_by?: string | null
          current_alternatives: string
          id?: string
          interview_date: string
          interviewee_type: string
          main_pain_points: string
          memorable_quotes?: string[] | null
          mentor_feedback?: string | null
          problem_importance: number
          problem_importance_quote?: string | null
          project_id: string
          segment_name: string
          status?: string
          student_reflection?: string | null
          surprising_feedback?: string | null
          updated_at?: string | null
        }
        Update: {
          context?: string
          created_at?: string | null
          created_by?: string | null
          current_alternatives?: string
          id?: string
          interview_date?: string
          interviewee_type?: string
          main_pain_points?: string
          memorable_quotes?: string[] | null
          mentor_feedback?: string | null
          problem_importance?: number
          problem_importance_quote?: string | null
          project_id?: string
          segment_name?: string
          status?: string
          student_reflection?: string | null
          surprising_feedback?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_interviews_enhanced_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_interviews_enhanced_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_iterations: {
        Row: {
          assumptions_affected: string[] | null
          changes: string
          created_at: string | null
          created_by: string | null
          date: string
          id: string
          next_experiment: string | null
          patterns_observed: string | null
          project_id: string
          reasoning: string
          riskiest_assumption: string | null
          version: number
        }
        Insert: {
          assumptions_affected?: string[] | null
          changes: string
          created_at?: string | null
          created_by?: string | null
          date: string
          id?: string
          next_experiment?: string | null
          patterns_observed?: string | null
          project_id: string
          reasoning: string
          riskiest_assumption?: string | null
          version: number
        }
        Update: {
          assumptions_affected?: string[] | null
          changes?: string
          created_at?: string | null
          created_by?: string | null
          date?: string
          id?: string
          next_experiment?: string | null
          patterns_observed?: string | null
          project_id?: string
          reasoning?: string
          riskiest_assumption?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "project_iterations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_iterations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_module_completion: {
        Row: {
          completed: boolean
          completed_at: string | null
          created_at: string | null
          id: string
          module_name: string
          project_id: string
          updated_at: string | null
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string | null
          id?: string
          module_name: string
          project_id: string
          updated_at?: string | null
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string | null
          id?: string
          module_name?: string
          project_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_module_completion_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_modules: {
        Row: {
          answer: string
          created_at: string | null
          id: string
          module_name: string
          project_id: string
          question_index: number
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          answer: string
          created_at?: string | null
          id?: string
          module_name: string
          project_id: string
          question_index: number
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          answer?: string
          created_at?: string | null
          id?: string
          module_name?: string
          project_id?: string
          question_index?: number
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_modules_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_modules_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      project_visual_sector_map: {
        Row: {
          created_at: string | null
          data: Json
          project_id: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          data?: Json
          project_id: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          data?: Json
          project_id?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_visual_sector_map_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_visual_sector_map_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          name: string
          organization_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          organization_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          organization_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_interview_preferences: {
        Row: {
          created_at: string | null
          id: string
          project_id: string
          updated_at: string | null
          use_enhanced_system: boolean
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          project_id: string
          updated_at?: string | null
          use_enhanced_system?: boolean
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          project_id?: string
          updated_at?: string | null
          use_enhanced_system?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_interview_preferences_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_interview_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_by_email: {
        Args: { user_email: string }
        Returns: {
          email: string
          id: string
        }[]
      }
      invite_user_to_organization: {
        Args: {
          p_organization_id: string
          p_role: string
          p_user_email: string
        }
        Returns: Json
      }
      is_admin: { Args: never; Returns: boolean }
      is_organization_creator: { Args: { org_id: string }; Returns: boolean }
      is_organization_member: { Args: { org_id: string }; Returns: boolean }
      is_organization_owner: { Args: { org_id: string }; Returns: boolean }
      user_can_access_project: {
        Args: { project_uuid: string }
        Returns: boolean
      }
      user_can_edit_project: {
        Args: { project_uuid: string }
        Returns: boolean
      }
      user_can_edit_project_check: {
        Args: { project_uuid: string }
        Returns: boolean
      }
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
