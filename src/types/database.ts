export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          is_admin: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          is_admin?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          is_admin?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      organizations: {
        Row: {
          id: string
          name: string
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_by?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organizations_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      organization_members: {
        Row: {
          id: string
          organization_id: string
          user_id: string
          role: 'owner' | 'editor' | 'viewer'
          joined_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          user_id: string
          role: 'owner' | 'editor' | 'viewer'
          joined_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          user_id?: string
          role?: 'owner' | 'editor' | 'viewer'
          joined_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      projects: {
        Row: {
          id: string
          organization_id: string
          name: string
          description: string | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          name: string
          description?: string | null
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          name?: string
          description?: string | null
          created_by?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_organization_id_fkey"
            columns: ["organization_id"]
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      project_modules: {
        Row: {
          id: string
          project_id: string
          module_name: 'problem' | 'customerSegments' | 'solution'
          question_index: number
          answer: string
          updated_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          module_name: 'problem' | 'customerSegments' | 'solution'
          question_index: number
          answer: string
          updated_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          module_name?: 'problem' | 'customerSegments' | 'solution'
          question_index?: number
          answer?: string
          updated_by?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_modules_project_id_fkey"
            columns: ["project_id"]
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_modules_updated_by_fkey"
            columns: ["updated_by"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      project_module_completion: {
        Row: {
          id: string
          project_id: string
          module_name: string
          completed: boolean
          completed_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          module_name: string
          completed?: boolean
          completed_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          module_name?: string
          completed?: boolean
          completed_at?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_module_completion_project_id_fkey"
            columns: ["project_id"]
            referencedRelation: "projects"
            referencedColumns: ["id"]
          }
        ]
      }
      project_assumptions: {
        Row: {
          id: string
          project_id: string
          type: 'customer' | 'problem' | 'solution'
          description: string
          status: 'untested' | 'testing' | 'validated' | 'invalidated'
          confidence: number | null
          evidence: string[] | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          type: 'customer' | 'problem' | 'solution'
          description: string
          status: 'untested' | 'testing' | 'validated' | 'invalidated'
          confidence?: number | null
          evidence?: string[] | null
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          type?: 'customer' | 'problem' | 'solution'
          description?: string
          status?: 'untested' | 'testing' | 'validated' | 'invalidated'
          confidence?: number | null
          evidence?: string[] | null
          created_by?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_assumptions_project_id_fkey"
            columns: ["project_id"]
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_assumptions_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      project_interviews: {
        Row: {
          id: string
          project_id: string
          date: string
          customer_segment: string
          interviewee: string | null
          interviewee_type: 'potential-buyer' | 'competitor' | 'substitute' | 'knowledgeable' | null
          format: 'in-person' | 'phone' | 'video' | 'survey' | null
          duration: number | null
          notes: string
          key_insights: string[] | null
          surprises: string | null
          next_action: string | null
          follow_up_needed: boolean | null
          assumptions_addressed: string[] | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          date: string
          customer_segment: string
          interviewee?: string | null
          interviewee_type?: 'potential-buyer' | 'competitor' | 'substitute' | 'knowledgeable' | null
          format?: 'in-person' | 'phone' | 'video' | 'survey' | null
          duration?: number | null
          notes: string
          key_insights?: string[] | null
          surprises?: string | null
          next_action?: string | null
          follow_up_needed?: boolean | null
          assumptions_addressed?: string[] | null
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          date?: string
          customer_segment?: string
          interviewee?: string | null
          interviewee_type?: 'potential-buyer' | 'competitor' | 'substitute' | 'knowledgeable' | null
          format?: 'in-person' | 'phone' | 'video' | 'survey' | null
          duration?: number | null
          notes?: string
          key_insights?: string[] | null
          surprises?: string | null
          next_action?: string | null
          follow_up_needed?: boolean | null
          assumptions_addressed?: string[] | null
          created_by?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_interviews_project_id_fkey"
            columns: ["project_id"]
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_interviews_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      project_iterations: {
        Row: {
          id: string
          project_id: string
          version: number
          date: string
          changes: string
          reasoning: string
          patterns_observed: string | null
          riskiest_assumption: string | null
          next_experiment: string | null
          assumptions_affected: string[] | null
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          version: number
          date: string
          changes: string
          reasoning: string
          patterns_observed?: string | null
          riskiest_assumption?: string | null
          next_experiment?: string | null
          assumptions_affected?: string[] | null
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          version?: number
          date?: string
          changes?: string
          reasoning?: string
          patterns_observed?: string | null
          riskiest_assumption?: string | null
          next_experiment?: string | null
          assumptions_affected?: string[] | null
          created_by?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_iterations_project_id_fkey"
            columns: ["project_id"]
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_iterations_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      project_competitors: {
        Row: {
          id: string
          project_id: string
          name: string
          description: string | null
          suppliers: string[] | null
          customers: string[] | null
          supplier_companies: string | null
          industry_customers: string | null
          technical_regulatory_change: string | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          name: string
          description?: string | null
          suppliers?: string[] | null
          customers?: string[] | null
          supplier_companies?: string | null
          industry_customers?: string | null
          technical_regulatory_change?: string | null
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          name?: string
          description?: string | null
          suppliers?: string[] | null
          customers?: string[] | null
          supplier_companies?: string | null
          industry_customers?: string | null
          technical_regulatory_change?: string | null
          created_by?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_competitors_project_id_fkey"
            columns: ["project_id"]
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_competitors_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      project_decision_makers: {
        Row: {
          id: string
          project_id: string
          role: string
          influence: 'decision-maker' | 'influencer' | 'payer' | null
          description: string | null
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          role: string
          influence?: 'decision-maker' | 'influencer' | 'payer' | null
          description?: string | null
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          role?: string
          influence?: 'decision-maker' | 'influencer' | 'payer' | null
          description?: string | null
          created_by?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_decision_makers_project_id_fkey"
            columns: ["project_id"]
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_decision_makers_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      project_first_target: {
        Row: {
          id: string
          project_id: string
          customer_type: 'business' | 'consumer' | null
          description: string | null
          company_size: string | null
          location: string | null
          who_will_use: string | null
          who_has_budget: string | null
          other_influencers: string | null
          updated_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          customer_type?: 'business' | 'consumer' | null
          description?: string | null
          company_size?: string | null
          location?: string | null
          who_will_use?: string | null
          who_has_budget?: string | null
          other_influencers?: string | null
          updated_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          customer_type?: 'business' | 'consumer' | null
          description?: string | null
          company_size?: string | null
          location?: string | null
          who_will_use?: string | null
          who_has_budget?: string | null
          other_influencers?: string | null
          updated_by?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_first_target_project_id_fkey"
            columns: ["project_id"]
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_first_target_updated_by_fkey"
            columns: ["updated_by"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_by_email: {
        Args: {
          user_email: string
        }
        Returns: Array<{
          id: string
          email: string
        }>
      }
      invite_user_to_organization: {
        Args: {
          p_organization_id: string
          p_user_email: string
          p_role: string
        }
        Returns: {
          success: boolean
          error?: string
          user_id?: string
          email?: string
        }
      }
      user_can_access_project: {
        Args: {
          project_uuid: string
        }
        Returns: boolean
      }
      user_can_edit_project: {
        Args: {
          project_uuid: string
        }
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
