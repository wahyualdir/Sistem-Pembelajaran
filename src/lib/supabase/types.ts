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
    };
  };
}
