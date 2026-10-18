export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserStatus = 'PENDING' | 'ACTIVE' | 'LOCKED' | 'SUSPENDED' | 'DEACTIVATED';
export type IdentifierType = 'NIM' | 'NIDN' | 'NIP' | 'EMAIL' | 'USERNAME';
export type ScopeType = 'GLOBAL' | 'PROGRAM' | 'CLASS';
export type UserRoleStatus = 'ACTIVE' | 'REVOKED' | 'EXPIRED';
export type EventType =
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILED'
  | 'LOGOUT'
  | 'SESSION_REVOKED'
  | 'PASSWORD_CHANGED'
  | 'REPORTED_NOT_ME'
  | 'MFA_CHALLENGE';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          email: string;
          status: UserStatus;
          must_change_password: boolean;
          locked_until: string | null;
          last_login_at: string | null;
          preferred_locale: string;
          timezone: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          email: string;
          status?: UserStatus;
          must_change_password?: boolean;
          locked_until?: string | null;
          last_login_at?: string | null;
          preferred_locale?: string;
          timezone?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          email?: string;
          status?: UserStatus;
          must_change_password?: boolean;
          locked_until?: string | null;
          last_login_at?: string | null;
          preferred_locale?: string;
          timezone?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_identifiers: {
        Row: {
          id: string;
          user_id: string;
          type: IdentifierType;
          value: string;
          is_primary: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: IdentifierType;
          value: string;
          is_primary?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: IdentifierType;
          value?: string;
          is_primary?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      roles: {
        Row: {
          id: string;
          code: string;
          name: string;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          name: string;
          description?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          name?: string;
          description?: string | null;
          created_at?: string;
        };
      };
      permissions: {
        Row: {
          id: string;
          code: string;
          resource: string;
          action: string;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          resource: string;
          action: string;
          description?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          resource?: string;
          action?: string;
          description?: string | null;
          created_at?: string;
        };
      };
      role_permissions: {
        Row: {
          role_id: string;
          permission_id: string;
        };
        Insert: {
          role_id: string;
          permission_id: string;
        };
        Update: {
          role_id?: string;
          permission_id?: string;
        };
      };
      user_roles: {
        Row: {
          id: string;
          user_id: string;
          role_id: string;
          scope_type: ScopeType;
          scope_id: string | null;
          valid_from: string;
          valid_until: string | null;
          granted_by: string | null;
          status: UserRoleStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          role_id: string;
          scope_type?: ScopeType;
          scope_id?: string | null;
          valid_from?: string;
          valid_until?: string | null;
          granted_by?: string | null;
          status?: UserRoleStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          role_id?: string;
          scope_type?: ScopeType;
          scope_id?: string | null;
          valid_from?: string;
          valid_until?: string | null;
          granted_by?: string | null;
          status?: UserRoleStatus;
          created_at?: string;
          updated_at?: string;
        };
      };
      audit_logs: {
        Row: {
          id: string;
          actor_user_id: string | null;
          actor_role: string | null;
          action: string;
          entity_type: string;
          entity_id: string | null;
          scope_type: string | null;
          scope_id: string | null;
          before_json: Json | null;
          after_json: Json | null;
          ip_address: string | null;
          user_agent: string | null;
          request_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          actor_user_id?: string | null;
          actor_role?: string | null;
          action: string;
          entity_type: string;
          entity_id?: string | null;
          scope_type?: string | null;
          scope_id?: string | null;
          before_json?: Json | null;
          after_json?: Json | null;
          ip_address?: string | null;
          user_agent?: string | null;
          request_id?: string | null;
          created_at?: string;
        };
        Update: never;
      };
      user_devices: {
        Row: {
          id: string;
          user_id: string;
          device_id_hash: string;
          label: string;
          first_seen_at: string;
          last_seen_at: string;
          last_ip_masked: string | null;
          last_country: string | null;
          last_city: string | null;
          last_session_id: string | null;
          trusted: boolean;
          revoked_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          device_id_hash: string;
          label: string;
          first_seen_at?: string;
          last_seen_at?: string;
          last_ip_masked?: string | null;
          last_country?: string | null;
          last_city?: string | null;
          last_session_id?: string | null;
          trusted?: boolean;
          revoked_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          device_id_hash?: string;
          label?: string;
          first_seen_at?: string;
          last_seen_at?: string;
          last_ip_masked?: string | null;
          last_country?: string | null;
          last_city?: string | null;
          last_session_id?: string | null;
          trusted?: boolean;
          revoked_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      login_events: {
        Row: {
          id: string;
          user_id: string;
          device_id: string | null;
          event_type: EventType;
          is_new_device: boolean;
          risk_level: RiskLevel;
          ip_masked: string | null;
          country: string | null;
          city: string | null;
          notified_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          device_id?: string | null;
          event_type: EventType;
          is_new_device?: boolean;
          risk_level?: RiskLevel;
          ip_masked?: string | null;
          country?: string | null;
          city?: string | null;
          notified_at?: string | null;
          created_at?: string;
        };
        Update: never;
      };
      system_settings: {
        Row: {
          key: string;
          value_json: Json;
          updated_by: string | null;
          updated_at: string;
        };
        Insert: {
          key: string;
          value_json: Json;
          updated_by?: string | null;
          updated_at?: string;
        };
        Update: {
          key?: string;
          value_json?: Json;
          updated_by?: string | null;
          updated_at?: string;
        };
      };
      class_assistants: {
        Row: {
          id: string;
          class_id: string;
          user_id: string;
          permission: string;
          can_open_attendance: boolean;
          can_view_similarity: boolean;
          granted_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          class_id: string;
          user_id: string;
          permission: string;
          can_open_attendance?: boolean;
          can_view_similarity?: boolean;
          granted_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          class_id?: string;
          user_id?: string;
          permission?: string;
          can_open_attendance?: boolean;
          can_view_similarity?: boolean;
          granted_by?: string;
          created_at?: string;
        };
      };
      student_requests: {
        Row: {
          id: string;
          student_id: string;
          type: 'surat_aktif' | 'dispensasi' | 'cuti' | 'legalisir';
          details: Json;
          attachment_path: string | null;
          status: 'MENUNGGU' | 'DIPROSES' | 'DISETUJUI' | 'DITOLAK';
          staff_note: string | null;
          result_path: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          type: 'surat_aktif' | 'dispensasi' | 'cuti' | 'legalisir';
          details?: Json;
          attachment_path?: string | null;
          status?: 'MENUNGGU' | 'DIPROSES' | 'DISETUJUI' | 'DITOLAK';
          staff_note?: string | null;
          result_path?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          type?: 'surat_aktif' | 'dispensasi' | 'cuti' | 'legalisir';
          details?: Json;
          attachment_path?: string | null;
          status?: 'MENUNGGU' | 'DIPROSES' | 'DISETUJUI' | 'DITOLAK';
          staff_note?: string | null;
          result_path?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      allowed_email_domains: {
        Row: {
          id: string;
          domain: string;
          role_hint: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          domain: string;
          role_hint?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          domain?: string;
          role_hint?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
      };
      email_allowlist: {
        Row: {
          id: string;
          email: string;
          role_hint: string | null;
          notes: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          role_hint?: string | null;
          notes?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          role_hint?: string | null;
          notes?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
      };
      institution_policies: {
        Row: {
          key: string;
          value: Json;
          description: string | null;
          updated_by: string | null;
          updated_at: string;
        };
        Insert: {
          key: string;
          value: Json;
          description?: string | null;
          updated_by?: string | null;
          updated_at?: string;
        };
        Update: {
          key?: string;
          value?: Json;
          description?: string | null;
          updated_by?: string | null;
          updated_at?: string;
        };
      };
      scheduled_notifications: {
        Row: {
          id: string;
          user_id: string;
          kind: string;
          payload: Json;
          send_at: string;
          sent_at: string | null;
          dedupe_key: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          kind: string;
          payload?: Json;
          send_at?: string;
          sent_at?: string | null;
          dedupe_key?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          kind?: string;
          payload?: Json;
          send_at?: string;
          sent_at?: string | null;
          dedupe_key?: string | null;
          created_at?: string;
        };
      };
      assignments: {
        Row: {
          id: string;
          class_id: string;
          title: string;
          description: string;
          due_at: string;
          close_at: string;
          release_at: string | null;
          max_score: number;
          late_policy: 'none' | 'per_day' | 'per_hour' | 'flat';
          late_penalty_value: number;
          late_penalty_cap: number;
          allow_resubmit: boolean;
          max_resubmits: number | null;
          submission_mode: 'individual' | 'group';
          group_set_id: string | null;
          rubric_snapshot: Json | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          class_id: string;
          title: string;
          description?: string;
          due_at: string;
          close_at: string;
          release_at?: string | null;
          max_score?: number;
          late_policy?: 'none' | 'per_day' | 'per_hour' | 'flat';
          late_penalty_value?: number;
          late_penalty_cap?: number;
          allow_resubmit?: boolean;
          max_resubmits?: number | null;
          submission_mode?: 'individual' | 'group';
          group_set_id?: string | null;
          rubric_snapshot?: Json | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          class_id?: string;
          title?: string;
          description?: string;
          due_at?: string;
          close_at?: string;
          release_at?: string | null;
          max_score?: number;
          late_policy?: 'none' | 'per_day' | 'per_hour' | 'flat';
          late_penalty_value?: number;
          late_penalty_cap?: number;
          allow_resubmit?: boolean;
          max_resubmits?: number | null;
          submission_mode?: 'individual' | 'group';
          group_set_id?: string | null;
          rubric_snapshot?: Json | null;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      assignment_extensions: {
        Row: {
          id: string;
          assignment_id: string;
          student_id: string | null;
          group_id: string | null;
          new_due_at: string;
          new_close_at: string | null;
          reason: string;
          granted_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          assignment_id: string;
          student_id?: string | null;
          group_id?: string | null;
          new_due_at: string;
          new_close_at?: string | null;
          reason: string;
          granted_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          assignment_id?: string;
          student_id?: string | null;
          group_id?: string | null;
          new_due_at?: string;
          new_close_at?: string | null;
          reason?: string;
          granted_by?: string;
          created_at?: string;
        };
      };
      submissions: {
        Row: {
          id: string;
          assignment_id: string;
          student_id: string;
          attempt_no: number;
          status: string;
          text_body: string;
          submitted_at: string;
          is_late: boolean;
          late_minutes: number;
          raw_score: number | null;
          penalty_percent: number;
          penalty_waived: boolean;
          penalty_waived_reason: string | null;
          group_id: string | null;
          submitted_by: string | null;
        };
        Insert: {
          id?: string;
          assignment_id: string;
          student_id: string;
          attempt_no?: number;
          status?: string;
          text_body: string;
          submitted_at?: string;
          is_late?: boolean;
          late_minutes?: number;
          raw_score?: number | null;
          penalty_percent?: number;
          penalty_waived?: boolean;
          penalty_waived_reason?: string | null;
          group_id?: string | null;
          submitted_by?: string | null;
        };
        Update: {
          id?: string;
          assignment_id?: string;
          student_id?: string;
          attempt_no?: number;
          status?: string;
          text_body?: string;
          submitted_at?: string;
          is_late?: boolean;
          late_minutes?: number;
          raw_score?: number | null;
          penalty_percent?: number;
          penalty_waived?: boolean;
          penalty_waived_reason?: string | null;
          group_id?: string | null;
          submitted_by?: string | null;
        };
      };
      submission_versions: {
        Row: {
          id: string;
          submission_id: string;
          attempt_no: number;
          file_paths: Json;
          submitted_at: string;
        };
        Insert: {
          id?: string;
          submission_id: string;
          attempt_no: number;
          file_paths?: Json;
          submitted_at?: string;
        };
        Update: {
          id?: string;
          submission_id?: string;
          attempt_no?: number;
          file_paths?: Json;
          submitted_at?: string;
        };
      };
      group_sets: {
        Row: {
          id: string;
          class_id: string;
          name: string;
          formation: 'lecturer' | 'random' | 'self';
          min_size: number;
          max_size: number;
          lock_at: string | null;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          class_id: string;
          name: string;
          formation: 'lecturer' | 'random' | 'self';
          min_size?: number;
          max_size?: number;
          lock_at?: string | null;
          created_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          class_id?: string;
          name?: string;
          formation?: 'lecturer' | 'random' | 'self';
          min_size?: number;
          max_size?: number;
          lock_at?: string | null;
          created_by?: string;
          created_at?: string;
        };
      };
      groups: {
        Row: {
          id: string;
          set_id: string;
          name: string;
          join_code: string;
        };
        Insert: {
          id?: string;
          set_id: string;
          name: string;
          join_code: string;
        };
        Update: {
          id?: string;
          set_id?: string;
          name?: string;
          join_code?: string;
        };
      };
      group_members: {
        Row: {
          group_id: string;
          set_id: string;
          student_id: string;
          role: 'leader' | 'member';
          joined_at: string;
        };
        Insert: {
          group_id: string;
          set_id: string;
          student_id: string;
          role?: 'leader' | 'member';
          joined_at?: string;
        };
        Update: {
          group_id?: string;
          set_id?: string;
          student_id?: string;
          role?: 'leader' | 'member';
          joined_at?: string;
        };
      };
      submission_member_adjustments: {
        Row: {
          submission_id: string;
          student_id: string;
          contribution_percent: number;
          note: string | null;
        };
        Insert: {
          submission_id: string;
          student_id: string;
          contribution_percent?: number;
          note?: string | null;
        };
        Update: {
          submission_id?: string;
          student_id?: string;
          contribution_percent?: number;
          note?: string | null;
        };
      };
      rubrics: {
        Row: {
          id: string;
          owner_id: string;
          title: string;
          description: string | null;
          is_template: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          title: string;
          description?: string | null;
          is_template?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          title?: string;
          description?: string | null;
          is_template?: boolean;
          created_at?: string;
        };
      };
      rubric_criteria: {
        Row: {
          id: string;
          rubric_id: string;
          position: number;
          title: string;
          description: string | null;
          max_points: number;
        };
        Insert: {
          id?: string;
          rubric_id: string;
          position: number;
          title: string;
          description?: string | null;
          max_points: number;
        };
        Update: {
          id?: string;
          rubric_id?: string;
          position?: number;
          title?: string;
          description?: string | null;
          max_points?: number;
        };
      };
      rubric_levels: {
        Row: {
          id: string;
          criterion_id: string;
          position: number;
          label: string;
          description: string | null;
          points: number;
        };
        Insert: {
          id?: string;
          criterion_id: string;
          position: number;
          label: string;
          description?: string | null;
          points: number;
        };
        Update: {
          id?: string;
          criterion_id?: string;
          position?: number;
          label?: string;
          description?: string | null;
          points?: number;
        };
      };
      rubric_scores: {
        Row: {
          submission_id: string;
          criterion_id: string;
          level_label: string | null;
          points: number;
          comment: string | null;
          graded_by: string;
          created_at: string;
        };
        Insert: {
          submission_id: string;
          criterion_id: string;
          level_label?: string | null;
          points: number;
          comment?: string | null;
          graded_by: string;
          created_at?: string;
        };
        Update: {
          submission_id?: string;
          criterion_id?: string;
          level_label?: string | null;
          points?: number;
          comment?: string | null;
          graded_by?: string;
          created_at?: string;
        };
      };
      feedback_comments: {
        Row: {
          id: string;
          submission_id: string;
          author_id: string;
          file_path: string | null;
          anchor: Json | null;
          body: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          submission_id: string;
          author_id: string;
          file_path?: string | null;
          anchor?: Json | null;
          body: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          submission_id?: string;
          author_id?: string;
          file_path?: string | null;
          anchor?: Json | null;
          body?: string;
          created_at?: string;
        };
      };
      grade_disputes: {
        Row: {
          id: string;
          class_id: string;
          student_id: string;
          target_type: 'submission' | 'exam_attempt' | 'exam_question' | 'attendance';
          target_id: string;
          reason: string;
          evidence_path: string | null;
          status: 'diajukan' | 'ditinjau' | 'diterima' | 'ditolak' | 'ditarik';
          response: string | null;
          old_score: number | null;
          new_score: number | null;
          resolved_by: string | null;
          resolved_at: string | null;
          linked_change_request_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          class_id: string;
          student_id: string;
          target_type: 'submission' | 'exam_attempt' | 'exam_question' | 'attendance';
          target_id: string;
          reason: string;
          evidence_path?: string | null;
          status?: 'diajukan' | 'ditinjau' | 'diterima' | 'ditolak' | 'ditarik';
          response?: string | null;
          old_score?: number | null;
          new_score?: number | null;
          resolved_by?: string | null;
          resolved_at?: string | null;
          linked_change_request_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          class_id?: string;
          student_id?: string;
          target_type?: 'submission' | 'exam_attempt' | 'exam_question' | 'attendance';
          target_id?: string;
          reason?: string;
          evidence_path?: string | null;
          status?: 'diajukan' | 'ditinjau' | 'diterima' | 'ditolak' | 'ditarik';
          response?: string | null;
          old_score?: number | null;
          new_score?: number | null;
          resolved_by?: string | null;
          resolved_at?: string | null;
          linked_change_request_id?: string | null;
          created_at?: string;
        };
      };
      grade_dispute_messages: {
        Row: {
          id: string;
          dispute_id: string;
          author_id: string;
          body: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          dispute_id: string;
          author_id: string;
          body: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          dispute_id?: string;
          author_id?: string;
          body?: string;
          created_at?: string;
        };
      };
      absence_requests: {
        Row: {
          id: string;
          student_id: string;
          type: 'izin' | 'sakit';
          start_date: string;
          end_date: string;
          reason: string;
          attachment_path: string | null;
          cancelled_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          type: 'izin' | 'sakit';
          start_date: string;
          end_date: string;
          reason: string;
          attachment_path?: string | null;
          cancelled_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          type?: 'izin' | 'sakit';
          start_date?: string;
          end_date?: string;
          reason?: string;
          attachment_path?: string | null;
          cancelled_at?: string | null;
          created_at?: string;
        };
      };
      absence_request_items: {
        Row: {
          id: string;
          request_id: string;
          class_id: string;
          session_id: string;
          status: 'menunggu' | 'disetujui' | 'ditolak';
          reviewed_by: string | null;
          reviewed_at: string | null;
          review_note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          request_id: string;
          class_id: string;
          session_id: string;
          status?: 'menunggu' | 'disetujui' | 'ditolak';
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          review_note?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          request_id?: string;
          class_id?: string;
          session_id?: string;
          status?: 'menunggu' | 'disetujui' | 'ditolak';
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          review_note?: string | null;
          created_at?: string;
        };
      };
      class_session_journals: {
        Row: {
          id: string;
          class_id: string;
          session_id: string;
          held_on: string;
          mode: 'luring' | 'daring' | 'hibrida';
          topic: string;
          summary: string | null;
          method: string | null;
          obstacles: string | null;
          status: 'draf' | 'final';
          is_late: boolean;
          finalized_by: string | null;
          finalized_at: string | null;
          revision_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          class_id: string;
          session_id: string;
          held_on: string;
          mode: 'luring' | 'daring' | 'hibrida';
          topic: string;
          summary?: string | null;
          method?: string | null;
          obstacles?: string | null;
          status?: 'draf' | 'final';
          is_late?: boolean;
          finalized_by?: string | null;
          finalized_at?: string | null;
          revision_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          class_id?: string;
          session_id?: string;
          held_on?: string;
          mode?: 'luring' | 'daring' | 'hibrida';
          topic?: string;
          summary?: string | null;
          method?: string | null;
          obstacles?: string | null;
          status?: 'draf' | 'final';
          is_late?: boolean;
          finalized_by?: string | null;
          finalized_at?: string | null;
          revision_count?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      journal_materials: {
        Row: {
          journal_id: string;
          material_id: string;
          created_at: string;
        };
        Insert: {
          journal_id: string;
          material_id: string;
          created_at?: string;
        };
        Update: {
          journal_id?: string;
          material_id?: string;
          created_at?: string;
        };
      };
      material_progress: {
        Row: {
          material_id: string;
          student_id: string;
          status: 'dibuka' | 'selesai';
          first_opened_at: string;
          completed_at: string | null;
        };
        Insert: {
          material_id: string;
          student_id: string;
          status?: 'dibuka' | 'selesai';
          first_opened_at?: string;
          completed_at?: string | null;
        };
        Update: {
          material_id?: string;
          student_id?: string;
          status?: 'dibuka' | 'selesai';
          first_opened_at?: string;
          completed_at?: string | null;
        };
      };
      quizzes: {
        Row: {
          id: string;
          class_id: string;
          title: string;
          description: string;
          exam_type: string;
          duration_minutes: number;
          start_time: string;
          end_time: string;
          max_attempts: number;
          shuffle_questions: boolean;
          shuffle_options: boolean;
          is_published: boolean;
          strict_proctoring: boolean;
          proctoring_level: string;
          max_violations: number;
          require_fullscreen: boolean;
          block_copy_paste: boolean;
          require_attendance: boolean;
          passcode: string | null;
          kkm: number;
          result_display: string;
          status: string;
          total_points: number;
          access_mode: 'open' | 'token';
          parent_quiz_id: string | null;
          kind: 'utama' | 'susulan' | 'remedial';
          score_cap: number | null;
          combine_policy: 'tertinggi' | 'ganti' | 'rata_rata';
          release_at: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          class_id: string;
          title: string;
          description?: string;
          exam_type?: string;
          duration_minutes?: number;
          start_time?: string;
          end_time?: string;
          max_attempts?: number;
          shuffle_questions?: boolean;
          shuffle_options?: boolean;
          is_published?: boolean;
          strict_proctoring?: boolean;
          proctoring_level?: string;
          max_violations?: number;
          require_fullscreen?: boolean;
          block_copy_paste?: boolean;
          require_attendance?: boolean;
          passcode?: string | null;
          kkm?: number;
          result_display?: string;
          status?: string;
          total_points?: number;
          access_mode?: 'open' | 'token';
          parent_quiz_id?: string | null;
          kind?: 'utama' | 'susulan' | 'remedial';
          score_cap?: number | null;
          combine_policy?: 'tertinggi' | 'ganti' | 'rata_rata';
          release_at?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          class_id?: string;
          title?: string;
          description?: string;
          exam_type?: string;
          duration_minutes?: number;
          start_time?: string;
          end_time?: string;
          max_attempts?: number;
          shuffle_questions?: boolean;
          shuffle_options?: boolean;
          is_published?: boolean;
          strict_proctoring?: boolean;
          proctoring_level?: string;
          max_violations?: number;
          require_fullscreen?: boolean;
          block_copy_paste?: boolean;
          require_attendance?: boolean;
          passcode?: string | null;
          kkm?: number;
          result_display?: string;
          status?: string;
          total_points?: number;
          access_mode?: 'open' | 'token';
          parent_quiz_id?: string | null;
          kind?: 'utama' | 'susulan' | 'remedial';
          score_cap?: number | null;
          combine_policy?: 'tertinggi' | 'ganti' | 'rata_rata';
          release_at?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
      };
      quiz_questions: {
        Row: {
          id: string;
          quiz_id: string | null;
          question_text: string;
          question_type: string;
          points: number;
          order_index: number;
          topic_tag: string | null;
          cpl_tag: string | null;
          difficulty: string | null;
          rubric: string | null;
          starter_code: string | null;
          programming_language: string | null;
          explanation: string | null;
          code_language: 'python' | 'javascript' | 'java' | 'c' | 'cpp' | 'php' | null;
          time_limit_ms: number;
          memory_limit_mb: number;
          compare_mode: 'exact' | 'trim' | 'tokens' | 'float';
          needs_revision: boolean;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          quiz_id?: string | null;
          question_text: string;
          question_type?: string;
          points?: number;
          order_index?: number;
          topic_tag?: string | null;
          cpl_tag?: string | null;
          difficulty?: string | null;
          rubric?: string | null;
          starter_code?: string | null;
          programming_language?: string | null;
          explanation?: string | null;
          code_language?: 'python' | 'javascript' | 'java' | 'c' | 'cpp' | 'php' | null;
          time_limit_ms?: number;
          memory_limit_mb?: number;
          compare_mode?: 'exact' | 'trim' | 'tokens' | 'float';
          needs_revision?: boolean;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          quiz_id?: string | null;
          question_text?: string;
          question_type?: string;
          points?: number;
          order_index?: number;
          topic_tag?: string | null;
          cpl_tag?: string | null;
          difficulty?: string | null;
          rubric?: string | null;
          starter_code?: string | null;
          programming_language?: string | null;
          explanation?: string | null;
          code_language?: 'python' | 'javascript' | 'java' | 'c' | 'cpp' | 'php' | null;
          time_limit_ms?: number;
          memory_limit_mb?: number;
          compare_mode?: 'exact' | 'trim' | 'tokens' | 'float';
          needs_revision?: boolean;
          metadata?: Json;
          created_at?: string;
        };
      };
      exam_attempts: {
        Row: {
          id: string;
          quiz_id: string;
          student_id: string;
          student_name: string | null;
          started_at: string;
          deadline_at: string;
          expires_at: string | null;
          extra_time_seconds: number;
          last_heartbeat_at: string | null;
          active_session_id: string | null;
          auto_submitted: boolean;
          submit_idempotency_key: string | null;
          finished_at: string | null;
          total_score: number;
          max_score: number;
          is_graded: boolean;
          violations_count: number;
          is_terminated: boolean;
          status: string;
          answers_json: Json;
          ai_grading_drafts: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          quiz_id: string;
          student_id: string;
          student_name?: string | null;
          started_at?: string;
          deadline_at?: string;
          expires_at?: string | null;
          extra_time_seconds?: number;
          last_heartbeat_at?: string | null;
          active_session_id?: string | null;
          auto_submitted?: boolean;
          submit_idempotency_key?: string | null;
          finished_at?: string | null;
          total_score?: number;
          max_score?: number;
          is_graded?: boolean;
          violations_count?: number;
          is_terminated?: boolean;
          status?: string;
          answers_json?: Json;
          ai_grading_drafts?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          quiz_id?: string;
          student_id?: string;
          student_name?: string | null;
          started_at?: string;
          deadline_at?: string;
          expires_at?: string | null;
          extra_time_seconds?: number;
          last_heartbeat_at?: string | null;
          active_session_id?: string | null;
          auto_submitted?: boolean;
          submit_idempotency_key?: string | null;
          finished_at?: string | null;
          total_score?: number;
          max_score?: number;
          is_graded?: boolean;
          violations_count?: number;
          is_terminated?: boolean;
          status?: string;
          answers_json?: Json;
          ai_grading_drafts?: Json;
          created_at?: string;
        };
      };
      exam_answers: {
        Row: {
          id: string;
          attempt_id: string;
          question_id: string;
          selected_option_id: string | null;
          essay_text: string | null;
          answer_data: Json;
          revision: number;
          is_draft: boolean;
          last_saved_at: string;
          updated_at: string;
          score_earned: number;
          graded_by: string | null;
          graded_at: string | null;
        };
        Insert: {
          id?: string;
          attempt_id: string;
          question_id: string;
          selected_option_id?: string | null;
          essay_text?: string | null;
          answer_data?: Json;
          revision?: number;
          is_draft?: boolean;
          last_saved_at?: string;
          updated_at?: string;
          score_earned?: number;
          graded_by?: string | null;
          graded_at?: string | null;
        };
        Update: {
          id?: string;
          attempt_id?: string;
          question_id?: string;
          selected_option_id?: string | null;
          essay_text?: string | null;
          answer_data?: Json;
          revision?: number;
          is_draft?: boolean;
          last_saved_at?: string;
          updated_at?: string;
          score_earned?: number;
          graded_by?: string | null;
          graded_at?: string | null;
        };
      };
      exam_events: {
        Row: {
          id: number;
          attempt_id: string;
          kind: 'offline' | 'online' | 'tab_hidden' | 'tab_visible' | 'fullscreen_exit' | 'sesi_ganda' | 'waktu_ditambah';
          meta: Json;
          client_time: string | null;
          server_time: string;
        };
        Insert: {
          id?: number;
          attempt_id: string;
          kind: 'offline' | 'online' | 'tab_hidden' | 'tab_visible' | 'fullscreen_exit' | 'sesi_ganda' | 'waktu_ditambah';
          meta?: Json;
          client_time?: string | null;
          server_time?: string;
        };
        Update: {
          id?: number;
          attempt_id?: string;
          kind?: 'offline' | 'online' | 'tab_hidden' | 'tab_visible' | 'fullscreen_exit' | 'sesi_ganda' | 'waktu_ditambah';
          meta?: Json;
          client_time?: string | null;
          server_time?: string;
        };
      };
      exam_access_tokens: {
        Row: {
          quiz_id: string;
          token: string;
          rotated_at: string;
          rotate_every_minutes: number | null;
        };
        Insert: {
          quiz_id: string;
          token: string;
          rotated_at?: string;
          rotate_every_minutes?: number | null;
        };
        Update: {
          quiz_id?: string;
          token?: string;
          rotated_at?: string;
          rotate_every_minutes?: number | null;
        };
      };
      exam_makeup_participants: {
        Row: {
          quiz_id: string;
          student_id: string;
          reason: string;
          approved_by: string;
          created_at: string;
        };
        Insert: {
          quiz_id: string;
          student_id: string;
          reason: string;
          approved_by: string;
          created_at?: string;
        };
        Update: {
          quiz_id?: string;
          student_id?: string;
          reason?: string;
          approved_by?: string;
          created_at?: string;
        };
      };
      coding_test_cases: {
        Row: {
          id: string;
          question_id: string;
          position: number;
          stdin: string;
          expected_stdout: string;
          is_hidden: boolean;
          weight: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          question_id: string;
          position?: number;
          stdin?: string;
          expected_stdout: string;
          is_hidden?: boolean;
          weight?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          question_id?: string;
          position?: number;
          stdin?: string;
          expected_stdout?: string;
          is_hidden?: boolean;
          weight?: number;
          created_at?: string;
        };
      };
      coding_submissions: {
        Row: {
          id: string;
          attempt_id: string;
          question_id: string;
          language: string;
          source_code: string;
          purpose: 'coba' | 'final';
          status: 'antre' | 'berjalan' | 'selesai' | 'galat';
          compile_output: string | null;
          results: Json;
          score: number | null;
          judged_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          attempt_id: string;
          question_id: string;
          language: string;
          source_code: string;
          purpose: 'coba' | 'final';
          status?: 'antre' | 'berjalan' | 'selesai' | 'galat';
          compile_output?: string | null;
          results?: Json;
          score?: number | null;
          judged_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          attempt_id?: string;
          question_id?: string;
          language?: string;
          source_code?: string;
          purpose?: 'coba' | 'final';
          status?: 'antre' | 'berjalan' | 'selesai' | 'galat';
          compile_output?: string | null;
          results?: Json;
          score?: number | null;
          judged_at?: string | null;
          created_at?: string;
        };
      };
      exam_item_stats: {
        Row: {
          quiz_id: string;
          question_id: string;
          n: number;
          difficulty_p: number | null;
          discrimination_d: number | null;
          point_biserial: number | null;
          option_counts: Json;
          avg_time_seconds: number | null;
          omit_rate: number | null;
          computed_at: string;
        };
        Insert: {
          quiz_id: string;
          question_id: string;
          n?: number;
          difficulty_p?: number | null;
          discrimination_d?: number | null;
          point_biserial?: number | null;
          option_counts?: Json;
          avg_time_seconds?: number | null;
          omit_rate?: number | null;
          computed_at?: string;
        };
        Update: {
          quiz_id?: string;
          question_id?: string;
          n?: number;
          difficulty_p?: number | null;
          discrimination_d?: number | null;
          point_biserial?: number | null;
          option_counts?: Json;
          avg_time_seconds?: number | null;
          omit_rate?: number | null;
          computed_at?: string;
        };
      };
      exam_summary_stats: {
        Row: {
          quiz_id: string;
          n: number;
          mean: number | null;
          median: number | null;
          stddev: number | null;
          min: number | null;
          max: number | null;
          kr20: number | null;
          histogram: Json;
          computed_at: string;
        };
        Insert: {
          quiz_id: string;
          n?: number;
          mean?: number | null;
          median?: number | null;
          stddev?: number | null;
          min?: number | null;
          max?: number | null;
          kr20?: number | null;
          histogram?: Json;
          computed_at?: string;
        };
        Update: {
          quiz_id?: string;
          n?: number;
          mean?: number | null;
          median?: number | null;
          stddev?: number | null;
          min?: number | null;
          max?: number | null;
          kr20?: number | null;
          histogram?: Json;
          computed_at?: string;
        };
      };
      cpl: {
        Row: {
          id: string;
          program_id: string;
          code: string;
          description: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          program_id: string;
          code: string;
          description: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          program_id?: string;
          code?: string;
          description?: string;
          created_at?: string;
        };
      };
      cpmk: {
        Row: {
          id: string;
          course_id: string;
          code: string;
          description: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          course_id: string;
          code: string;
          description: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          course_id?: string;
          code?: string;
          description?: string;
          created_at?: string;
        };
      };
      cpmk_cpl_map: {
        Row: {
          cpmk_id: string;
          cpl_id: string;
          weight_percent: number;
          created_at: string;
        };
        Insert: {
          cpmk_id: string;
          cpl_id: string;
          weight_percent?: number;
          created_at?: string;
        };
        Update: {
          cpmk_id?: string;
          cpl_id?: string;
          weight_percent?: number;
          created_at?: string;
        };
      };
      assessment_cpmk_map: {
        Row: {
          id: string;
          class_id: string;
          assessment_type: 'assignment' | 'question';
          assessment_id: string;
          cpmk_id: string;
          weight_percent: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          class_id: string;
          assessment_type: 'assignment' | 'question';
          assessment_id: string;
          cpmk_id: string;
          weight_percent?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          class_id?: string;
          assessment_type?: 'assignment' | 'question';
          assessment_id?: string;
          cpmk_id?: string;
          weight_percent?: number;
          created_at?: string;
        };
      };
      achievement_snapshots: {
        Row: {
          student_id: string;
          class_id: string;
          cpmk_id: string;
          score_percent: number | null;
          computed_at: string;
        };
        Insert: {
          student_id: string;
          class_id: string;
          cpmk_id: string;
          score_percent?: number | null;
          computed_at?: string;
        };
        Update: {
          student_id?: string;
          class_id?: string;
          cpmk_id?: string;
          score_percent?: number | null;
          computed_at?: string;
        };
      };
      journal_cpmk: {
        Row: {
          journal_id: string;
          cpmk_id: string;
        };
        Insert: {
          journal_id: string;
          cpmk_id: string;
        };
        Update: {
          journal_id?: string;
          cpmk_id?: string;
        };
      };
      similarity_runs: {
        Row: {
          id: string;
          assignment_id: string;
          started_by: string;
          scope: 'class' | 'course_history';
          status: 'antre' | 'berjalan' | 'selesai' | 'galat';
          threshold: number;
          created_at: string;
          finished_at: string | null;
        };
        Insert: {
          id?: string;
          assignment_id: string;
          started_by: string;
          scope?: 'class' | 'course_history';
          status?: 'antre' | 'berjalan' | 'selesai' | 'galat';
          threshold?: number;
          created_at?: string;
          finished_at?: string | null;
        };
        Update: {
          id?: string;
          assignment_id?: string;
          started_by?: string;
          scope?: 'class' | 'course_history';
          status?: 'antre' | 'berjalan' | 'selesai' | 'galat';
          threshold?: number;
          created_at?: string;
          finished_at?: string | null;
        };
      };
      submission_fingerprints: {
        Row: {
          submission_id: string;
          kind: 'teks' | 'kode';
          hashes: number[];
        };
        Insert: {
          submission_id: string;
          kind: 'teks' | 'kode';
          hashes: number[];
        };
        Update: {
          submission_id?: string;
          kind?: 'teks' | 'kode';
          hashes?: number[];
        };
      };
      similarity_pairs: {
        Row: {
          run_id: string;
          submission_a: string;
          submission_b: string;
          score: number;
          matched_segments: Json;
          review_status: 'baru' | 'wajar' | 'perlu_ditinjau';
          review_note: string | null;
        };
        Insert: {
          run_id: string;
          submission_a: string;
          submission_b: string;
          score: number;
          matched_segments?: Json;
          review_status?: 'baru' | 'wajar' | 'perlu_ditinjau';
          review_note?: string | null;
        };
        Update: {
          run_id?: string;
          submission_a?: string;
          submission_b?: string;
          score?: number;
          matched_segments?: Json;
          review_status?: 'baru' | 'wajar' | 'perlu_ditinjau';
          review_note?: string | null;
        };
      };
      conversations: {
        Row: {
          id: string;
          class_id: string | null;
          created_at: string;
          last_message_at: string | null;
        };
        Insert: {
          id?: string;
          class_id?: string | null;
          created_at?: string;
          last_message_at?: string | null;
        };
        Update: {
          id?: string;
          class_id?: string | null;
          created_at?: string;
          last_message_at?: string | null;
        };
      };
      conversation_participants: {
        Row: {
          conversation_id: string;
          user_id: string;
          last_read_at: string | null;
          muted: boolean;
        };
        Insert: {
          conversation_id: string;
          user_id: string;
          last_read_at?: string | null;
          muted?: boolean;
        };
        Update: {
          conversation_id?: string;
          user_id?: string;
          last_read_at?: string | null;
          muted?: boolean;
        };
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          sender_id: string;
          body: string;
          attachment_path: string | null;
          created_at: string;
          edited_at: string | null;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          sender_id: string;
          body: string;
          attachment_path?: string | null;
          created_at?: string;
          edited_at?: string | null;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          sender_id?: string;
          body?: string;
          attachment_path?: string | null;
          created_at?: string;
          edited_at?: string | null;
          deleted_at?: string | null;
        };
      };
      message_reports: {
        Row: {
          id: string;
          message_id: string;
          reporter_id: string;
          reason: string;
          snapshot: Json;
          status: 'baru' | 'ditinjau' | 'selesai' | 'ditolak';
          created_at: string;
        };
        Insert: {
          id?: string;
          message_id: string;
          reporter_id: string;
          reason: string;
          snapshot: Json;
          status?: 'baru' | 'ditinjau' | 'selesai' | 'ditolak';
          created_at?: string;
        };
        Update: {
          id?: string;
          message_id?: string;
          reporter_id?: string;
          reason?: string;
          snapshot?: Json;
          status?: 'baru' | 'ditinjau' | 'selesai' | 'ditolak';
          created_at?: string;
        };
      };
      consultation_slots: {
        Row: {
          id: string;
          lecturer_id: string;
          starts_at: string;
          ends_at: string;
          place_or_link: string | null;
          capacity: number;
          status: 'terbuka' | 'ditutup' | 'dibatalkan';
          created_at: string;
        };
        Insert: {
          id?: string;
          lecturer_id: string;
          starts_at: string;
          ends_at: string;
          place_or_link?: string | null;
          capacity?: number;
          status?: 'terbuka' | 'ditutup' | 'dibatalkan';
          created_at?: string;
        };
        Update: {
          id?: string;
          lecturer_id?: string;
          starts_at?: string;
          ends_at?: string;
          place_or_link?: string | null;
          capacity?: number;
          status?: 'terbuka' | 'ditutup' | 'dibatalkan';
          created_at?: string;
        };
      };
      consultation_bookings: {
        Row: {
          id: string;
          slot_id: string;
          student_id: string;
          topic: string;
          status: 'dipesan' | 'selesai' | 'dibatalkan' | 'tidak_hadir';
          lecturer_note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          slot_id: string;
          student_id: string;
          topic: string;
          status?: 'dipesan' | 'selesai' | 'dibatalkan' | 'tidak_hadir';
          lecturer_note?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          slot_id?: string;
          student_id?: string;
          topic?: string;
          status?: 'dipesan' | 'selesai' | 'dibatalkan' | 'tidak_hadir';
          lecturer_note?: string | null;
          created_at?: string;
        };
      };
      live_polls: {
        Row: {
          id: string;
          class_id: string;
          session_id: string | null;
          created_by: string;
          question: string;
          kind: 'single' | 'multiple' | 'scale' | 'text';
          options: Json | null;
          is_anonymous: boolean;
          is_quiz: boolean;
          correct_option_ids: string[] | null;
          status: 'draf' | 'buka' | 'tutup';
          opened_at: string | null;
          closed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          class_id: string;
          session_id?: string | null;
          created_by: string;
          question: string;
          kind: 'single' | 'multiple' | 'scale' | 'text';
          options?: Json | null;
          is_anonymous?: boolean;
          is_quiz?: boolean;
          correct_option_ids?: string[] | null;
          status?: 'draf' | 'buka' | 'tutup';
          opened_at?: string | null;
          closed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          class_id?: string;
          session_id?: string | null;
          created_by?: string;
          question?: string;
          kind?: 'single' | 'multiple' | 'scale' | 'text';
          options?: Json | null;
          is_anonymous?: boolean;
          is_quiz?: boolean;
          correct_option_ids?: string[] | null;
          status?: 'draf' | 'buka' | 'tutup';
          opened_at?: string | null;
          closed_at?: string | null;
          created_at?: string;
        };
      };
      live_poll_votes: {
        Row: {
          poll_id: string;
          student_id: string;
          answer: Json;
          created_at: string;
        };
        Insert: {
          poll_id: string;
          student_id: string;
          answer: Json;
          created_at?: string;
        };
        Update: {
          poll_id?: string;
          student_id?: string;
          answer?: Json;
          created_at?: string;
        };
      };
      xp_events: {
        Row: {
          id: string;
          student_id: string;
          class_id: string | null;
          kind: string;
          points: number;
          ref_type: string;
          ref_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          class_id?: string | null;
          kind: string;
          points: number;
          ref_type: string;
          ref_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          class_id?: string | null;
          kind?: string;
          points?: number;
          ref_type?: string;
          ref_id?: string;
          created_at?: string;
        };
      };
      badges: {
        Row: {
          code: string;
          name: string;
          description: string;
          icon: string;
          created_at: string;
        };
        Insert: {
          code: string;
          name: string;
          description: string;
          icon: string;
          created_at?: string;
        };
        Update: {
          code?: string;
          name?: string;
          description?: string;
          icon?: string;
          created_at?: string;
        };
      };
      study_streaks: {
        Row: {
          student_id: string;
          current_days: number;
          best_days: number;
          last_active_on: string | null;
        };
        Insert: {
          student_id: string;
          current_days?: number;
          best_days?: number;
          last_active_on?: string | null;
        };
        Update: {
          student_id?: string;
          current_days?: number;
          best_days?: number;
          last_active_on?: string | null;
        };
      };
      class_gamification_settings: {
        Row: {
          class_id: string;
          enabled: boolean;
          leaderboard_enabled: boolean;
        };
        Insert: {
          class_id: string;
          enabled?: boolean;
          leaderboard_enabled?: boolean;
        };
        Update: {
          class_id?: string;
          enabled?: boolean;
          leaderboard_enabled?: boolean;
        };
      };
      student_gamification_prefs: {
        Row: {
          student_id: string;
          show_on_leaderboard: boolean;
          display_alias: string | null;
        };
        Insert: {
          student_id: string;
          show_on_leaderboard?: boolean;
          display_alias?: string | null;
        };
        Update: {
          student_id?: string;
          show_on_leaderboard?: boolean;
          display_alias?: string | null;
        };
      };
      ai_reminders: {
        Row: {
          id: string;
          student_id: string;
          kind: 'tugas_h1' | 'tugas_3jam' | 'ujian_h1' | 'kehadiran' | 'materi_baru' | 'login_baru' | 'ringkasan_mingguan';
          ref_type: string | null;
          ref_id: string | null;
          payload: Json;
          message: string | null;
          status: 'terjadwal' | 'terkirim' | 'dibaca' | 'dibatalkan';
          scheduled_for: string;
          sent_at: string | null;
          dedupe_key: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          kind: 'tugas_h1' | 'tugas_3jam' | 'ujian_h1' | 'kehadiran' | 'materi_baru' | 'login_baru' | 'ringkasan_mingguan';
          ref_type?: string | null;
          ref_id?: string | null;
          payload: Json;
          message?: string | null;
          status?: 'terjadwal' | 'terkirim' | 'dibaca' | 'dibatalkan';
          scheduled_for: string;
          sent_at?: string | null;
          dedupe_key: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          kind?: 'tugas_h1' | 'tugas_3jam' | 'ujian_h1' | 'kehadiran' | 'materi_baru' | 'login_baru' | 'ringkasan_mingguan';
          ref_type?: string | null;
          ref_id?: string | null;
          payload?: Json;
          message?: string | null;
          status?: 'terjadwal' | 'terkirim' | 'dibaca' | 'dibatalkan';
          scheduled_for?: string;
          sent_at?: string | null;
          dedupe_key?: string;
          created_at?: string;
        };
      };
      ai_usage_logs: {
        Row: {
          id: number;
          student_id: string | null;
          kind: string | null;
          input_tokens: number | null;
          output_tokens: number | null;
          ok: boolean;
          created_at: string;
        };
        Insert: {
          id?: number;
          student_id?: string | null;
          kind?: string | null;
          input_tokens?: number | null;
          output_tokens?: number | null;
          ok?: boolean;
          created_at?: string;
        };
        Update: {
          id?: number;
          student_id?: string | null;
          kind?: string | null;
          input_tokens?: number | null;
          output_tokens?: number | null;
          ok?: boolean;
          created_at?: string;
        };
      };
      evaluation_templates: {
        Row: {
          id: string;
          name: string;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          created_by?: string | null;
          created_at?: string;
        };
      };
      evaluation_questions: {
        Row: {
          id: string;
          template_id: string;
          position: number;
          category: string | null;
          text: string;
          kind: 'skala' | 'teks';
          required: boolean;
        };
        Insert: {
          id?: string;
          template_id: string;
          position: number;
          category?: string | null;
          text: string;
          kind: 'skala' | 'teks';
          required?: boolean;
        };
        Update: {
          id?: string;
          template_id?: string;
          position?: number;
          category?: string | null;
          text?: string;
          kind?: 'skala' | 'teks';
          required?: boolean;
        };
      };
      evaluation_periods: {
        Row: {
          id: string;
          semester_id: string;
          template_id: string;
          name: string;
          opens_at: string;
          closes_at: string;
          status: 'draf' | 'buka' | 'tutup';
          require_before_final_grades: boolean;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          semester_id: string;
          template_id: string;
          name: string;
          opens_at: string;
          closes_at: string;
          status?: 'draf' | 'buka' | 'tutup';
          require_before_final_grades?: boolean;
          created_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          semester_id?: string;
          template_id?: string;
          name?: string;
          opens_at?: string;
          closes_at?: string;
          status?: 'draf' | 'buka' | 'tutup';
          require_before_final_grades?: boolean;
          created_by?: string;
          created_at?: string;
        };
      };
      evaluation_targets: {
        Row: {
          id: string;
          period_id: string;
          class_id: string;
          lecturer_id: string;
        };
        Insert: {
          id?: string;
          period_id: string;
          class_id: string;
          lecturer_id: string;
        };
        Update: {
          id?: string;
          period_id?: string;
          class_id?: string;
          lecturer_id?: string;
        };
      };
      evaluation_completions: {
        Row: {
          target_id: string;
          student_id: string;
          completed_at: string;
        };
        Insert: {
          target_id: string;
          student_id: string;
          completed_at?: string;
        };
        Update: {
          target_id?: string;
          student_id?: string;
          completed_at?: string;
        };
      };
      evaluation_responses: {
        Row: {
          id: string;
          target_id: string;
          submitted_on: string;
        };
        Insert: {
          id?: string;
          target_id: string;
          submitted_on?: string;
        };
        Update: {
          id?: string;
          target_id?: string;
          submitted_on?: string;
        };
      };
      evaluation_answers: {
        Row: {
          response_id: string;
          question_id: string;
          value_int: number | null;
          value_text: string | null;
          is_hidden: boolean;
        };
        Insert: {
          response_id: string;
          question_id: string;
          value_int?: number | null;
          value_text?: string | null;
          is_hidden?: boolean;
        };
        Update: {
          response_id?: string;
          question_id?: string;
          value_int?: number | null;
          value_text?: string | null;
          is_hidden?: boolean;
        };
      };
    };
    Views: {
      audit_logs_for_sysadmin: {
        Row: {
          id: string;
          actor_user_id: string | null;
          actor_role: string | null;
          action: string;
          entity_type: string;
          entity_id: string | null;
          scope_type: string | null;
          scope_id: string | null;
          before_json: Json | null;
          after_json: Json | null;
          ip_address: string | null;
          user_agent: string | null;
          request_id: string | null;
          created_at: string;
        };
      };
    };
    Functions: {
      has_global_role: {
        Args: { p_role_code: string };
        Returns: boolean;
      };
      is_program_coordinator: {
        Args: { p_program_id: string };
        Returns: boolean;
      };
      is_class_staff: {
        Args: { p_class_id: string };
        Returns: boolean;
      };
      is_enrolled: {
        Args: { p_class_id: string };
        Returns: boolean;
      };
      has_class_permission: {
        Args: { p_class_id: string; p_permission_code: string };
        Returns: boolean;
      };
      revoke_user_device: {
        Args: { p_device_id: string };
        Returns: boolean;
      };
      report_not_me: {
        Args: { p_user_id: string; p_details?: string };
        Returns: boolean;
      };
      get_policy: {
        Args: { p_key: string };
        Returns: Json;
      };
      calc_late_penalty: {
        Args: {
          p_late_minutes: number;
          p_late_policy: string;
          p_late_penalty_value: number;
          p_late_penalty_cap: number;
        };
        Returns: number;
      };
      join_group_with_code: {
        Args: {
          p_set_id: string;
          p_join_code: string;
        };
        Returns: string;
      };
      leave_group: {
        Args: {
          p_group_id: string;
        };
        Returns: boolean;
      };
      attendance_percent: {
        Args: {
          p_student_id: string;
          p_class_id: string;
        };
        Returns: number;
      };
      review_absence_item: {
        Args: {
          p_item_id: string;
          p_decision: string;
          p_note?: string | null;
        };
        Returns: Json;
      };
      claim_attempt_session: {
        Args: { p_attempt_id: string };
        Returns: Json;
      };
      save_exam_answers: {
        Args: {
          p_attempt_id: string;
          p_session_id: string;
          p_items: Json;
        };
        Returns: Json;
      };
      exam_heartbeat: {
        Args: {
          p_attempt_id: string;
          p_session_id: string;
        };
        Returns: Json;
      };
      submit_exam: {
        Args: {
          p_attempt_id: string;
          p_session_id: string;
          p_idempotency_key: string;
        };
        Returns: Json;
      };
      grant_exam_extra_time: {
        Args: {
          p_attempt_id: string;
          p_seconds: number;
          p_reason: string;
        };
        Returns: Json;
      };
      enter_exam: {
        Args: {
          p_quiz_id: string;
          p_token: string;
        };
        Returns: Json;
      };
      get_exam_monitoring_summary: {
        Args: { p_quiz_id: string };
        Returns: Json;
      };
      finalize_expired_attempts: {
        Args: Record<PropertyKey, never>;
        Returns: number;
      };
      start_conversation: {
        Args: {
          target_user_id: string;
          p_class_id?: string | null;
        };
        Returns: string;
      };
      book_consultation_slot: {
        Args: {
          p_slot_id: string;
          p_topic: string;
        };
        Returns: Json;
      };
      cancel_consultation_booking: {
        Args: {
          p_booking_id: string;
        };
        Returns: Json;
      };
      submit_poll_vote: {
        Args: {
          p_poll_id: string;
          p_answer: Json;
        };
        Returns: Json;
      };
      get_poll_results: {
        Args: {
          p_poll_id: string;
        };
        Returns: Json;
      };
      award_xp: {
        Args: {
          p_student_id: string;
          p_class_id: string | null;
          p_kind: string;
          p_points: number;
          p_ref_type: string;
          p_ref_id: string;
        };
        Returns: Json;
      };
      get_class_leaderboard: {
        Args: {
          p_class_id: string;
        };
        Returns: Json;
      };
      submit_evaluation: {
        Args: {
          p_target_id: string;
          p_answers: Json;
        };
        Returns: Json;
      };
      get_lecturer_evaluation_summary: {
        Args: {
          p_target_id: string;
        };
        Returns: Json;
      };
    };
  };
}
