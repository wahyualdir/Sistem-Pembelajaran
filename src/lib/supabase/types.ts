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
          granted_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          class_id: string;
          user_id: string;
          permission: string;
          can_open_attendance?: boolean;
          granted_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          class_id?: string;
          user_id?: string;
          permission?: string;
          can_open_attendance?: boolean;
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
    };
  };
}
