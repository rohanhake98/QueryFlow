import type {
  Connection,
  ConnectionCreateRequest,
  HistoryListResponse,
  LoginRequest,
  QueryResponse,
  RegisterRequest,
  User,
} from '@/types';
import axios, { type AxiosResponse } from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
  withCredentials: true,
});

const makeResponse = <T>(data: T): AxiosResponse<T> => ({
  data,
  status: 200,
  statusText: 'OK',
  headers: {},
  config: { headers: {} },
} as AxiosResponse<T>);

const isDevBypass = () => {
  if (typeof window === 'undefined') return false;
  return process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === '1' || localStorage.getItem('dev_bypass') === '1';
};

const demoUser: User = {
  id: 'demo-user',
  email: 'demo@queryflow.local',
  full_name: 'Demo User',
  is_verified: true,
  avatar_url: null,
};

const demoConnections: Connection[] = [
  {
    id: 'demo-conn',
    display_name: 'Demo Analytics DB',
    db_type: 'postgresql',
    host: 'demo.db.local',
    database_name: 'queryflow_demo',
    schema_cached_at: new Date().toISOString(),
    is_active: true,
  },
];

// Inject access token from localStorage on every request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Auto-refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const { data } = await axios.post('/api/v1/auth/refresh', {}, { withCredentials: true });
        localStorage.setItem('access_token', data.access_token);
        original.headers.Authorization = `Bearer ${data.access_token}`;
        return api(original);
      } catch {
        localStorage.removeItem('access_token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ─── Auth ────────────────────────────────────────────────────────
export const authApi = {
  register: (data: RegisterRequest) => {
    if (isDevBypass()) return Promise.resolve(makeResponse(demoUser));
    return api.post('/auth/register', data);
  },
  login: async (data: LoginRequest) => {
    if (isDevBypass()) {
      localStorage.setItem('access_token', 'demo-token');
      return { access_token: 'demo-token' };
    }
    const res = await api.post('/auth/login', data);
    localStorage.setItem('access_token', res.data.access_token);
    return res.data;
  },
  logout: async () => {
    if (isDevBypass()) {
      localStorage.removeItem('access_token');
      return;
    }
    await api.post('/auth/logout');
    localStorage.removeItem('access_token');
  },
  me: (): Promise<{ data: User }> => {
    if (isDevBypass()) return Promise.resolve(makeResponse(demoUser));
    return api.get('/auth/me');
  },
  refresh: () => {
    if (isDevBypass()) return Promise.resolve(makeResponse({ access_token: 'demo-token' }));
    return api.post('/auth/refresh');
  },
};

// ─── Connections ─────────────────────────────────────────────────
export const connectionsApi = {
  create: (data: ConnectionCreateRequest) => {
    if (isDevBypass()) return Promise.resolve(makeResponse({ id: 'demo-created', ...data }));
    return api.post('/connections', data);
  },
  list: (): Promise<{ data: { connections: Connection[] } }> => {
    if (isDevBypass()) return Promise.resolve(makeResponse({ connections: demoConnections }));
    return api.get('/connections');
  },
  refreshSchema: (id: string) => {
    if (isDevBypass()) return Promise.resolve(makeResponse({ ok: true }));
    return api.post(`/connections/${id}/refresh-schema`);
  },
  delete: (id: string) => {
    if (isDevBypass()) return Promise.resolve(makeResponse({ ok: true }));
    return api.delete(`/connections/${id}`);
  },
};

// ─── Query ───────────────────────────────────────────────────────
export const queryApi = {
  ask: (connection_id: string, question: string): Promise<{ data: QueryResponse }> => {
    if (isDevBypass()) {
      const rows = [
        { metric: 'Revenue', value: 124000 },
        { metric: 'Orders', value: 3120 },
        { metric: 'Active Users', value: 842 },
      ];
      return Promise.resolve({
        data: {
          query_id: 'demo-query',
          question,
          generated_sql: `SELECT metric, value FROM demo_metrics WHERE question = '${question.replace(/'/g, "''")}'`,
          was_corrected: false,
          execution_time_ms: 120,
          result: {
            columns: [
              { name: 'metric', type: 'text' },
              { name: 'value', type: 'number' },
            ],
            rows,
            row_count: rows.length,
          },
          visualization: {
            chart_type: 'bar',
            x_axis: 'metric',
            y_axis: 'value',
            title: 'Demo KPIs',
          },
        },
      });
    }
    return api.post('/query/ask', { connection_id, question });
  },
};

// ─── History ─────────────────────────────────────────────────────
export const historyApi = {
  list: (params?: { connection_id?: string; limit?: number; offset?: number; saved_only?: boolean }) => {
    if (isDevBypass()) {
      const items = [
        {
          id: 'demo-history-1',
          question: 'Top products by revenue',
          generated_sql: 'SELECT product, SUM(revenue) FROM sales GROUP BY product ORDER BY SUM(revenue) DESC',
          chart_type: 'bar',
          row_count: 12,
          execution_time_ms: 310,
          status: 'success' as const,
          is_saved: true,
          saved_name: 'Revenue by Product',
          was_corrected: false,
          created_at: new Date().toISOString(),
        },
      ];
      return Promise.resolve(makeResponse({ total: items.length, items } as HistoryListResponse));
    }
    return api.get<HistoryListResponse>('/history', { params });
  },
  save: (id: string, saved_name: string) => {
    if (isDevBypass()) return Promise.resolve(makeResponse({ ok: true }));
    return api.patch(`/history/${id}/save`, { saved_name });
  },
};

export default api;
