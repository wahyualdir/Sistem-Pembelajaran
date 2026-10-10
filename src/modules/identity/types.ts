export interface ActionResponse<T = unknown> {
  ok: boolean;
  data?: T;
  error?: string;
  fieldErrors?: Record<string, string[]>;
  redirectTo?: string;
}
