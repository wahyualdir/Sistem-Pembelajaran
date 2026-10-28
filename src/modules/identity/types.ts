export interface ActionResponse<T = unknown> {
  ok: boolean;
  data?: T;
  error?: string;
  pesan?: string;
  kolom?: string;
  fieldErrors?: Record<string, string[]>;
  redirectTo?: string;
}
