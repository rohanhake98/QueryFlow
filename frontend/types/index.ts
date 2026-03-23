// All shared TypeScript types for QueryFlow frontend

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  is_verified: boolean;
  avatar_url?: string | null;
}

export interface Connection {
  id: string;
  display_name: string;
  db_type: 'postgresql' | 'mysql';
  host: string;
  database_name: string;
  schema_cached_at: string | null;
  is_active: boolean;
}

export interface ColumnMeta {
  name: string;
  type: string;
}

export interface QueryResult {
  columns: ColumnMeta[];
  rows: Record<string, unknown>[];
  row_count: number;
  total: number;
  limit: number;
  offset: number;
}

export interface VisualizationMeta {
  chart_type: 'bar' | 'line' | 'pie' | 'kpi' | 'table';
  x_axis?: string | null;
  y_axis?: string | null;
  title?: string | null;
}

export interface QueryResponse {
  query_id: string;
  question: string;
  generated_sql: string;
  was_corrected: boolean;
  execution_time_ms: number;
  result: QueryResult;
  visualization: VisualizationMeta;
}

export interface HistoryItem {
  id: string;
  question: string;
  generated_sql: string;
  chart_type: string | null;
  row_count: number | null;
  execution_time_ms: number | null;
  status: 'success' | 'error' | 'blocked';
  is_saved: boolean;
  saved_name?: string | null;
  was_corrected: boolean;
  created_at: string;
}

export interface HistoryListResponse {
  total: number;
  items: HistoryItem[];
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  full_name?: string;
}

export interface ConnectionCreateRequest {
  display_name: string;
  db_type: string;
  host: string;
  port: number;
  database_name: string;
  username: string;
  password: string;
  ssl_mode?: string;
}

export type LoadingStep = 'idle' | 'generating' | 'validating' | 'executing' | 'rendering' | 'done';
