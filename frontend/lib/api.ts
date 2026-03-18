import axios from 'axios';
import type {
  User, Connection, QueryResponse, HistoryListResponse,
  LoginRequest, RegisterRequest, ConnectionCreateRequest,
} from '@/types';

const api = axios.create({
  baseURL: '/api/v1',
  withCredentials: true,
});

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
  register: (data: RegisterRequest) => api.post('/auth/register', data),
  login: async (data: LoginRequest) => {
    const res = await api.post('/auth/login', data);
    localStorage.setItem('access_token', res.data.access_token);
    return res.data;
  },
  logout: async () => {
    await api.post('/auth/logout');
    localStorage.removeItem('access_token');
  },
  me: (): Promise<{ data: User }> => api.get('/auth/me'),
  refresh: () => api.post('/auth/refresh'),
};

// ─── Connections ─────────────────────────────────────────────────
export const connectionsApi = {
  create: (data: ConnectionCreateRequest) => api.post('/connections', data),
  list: (): Promise<{ data: { connections: Connection[] } }> => api.get('/connections'),
  refreshSchema: (id: string) => api.post(`/connections/${id}/refresh-schema`),
  delete: (id: string) => api.delete(`/connections/${id}`),
};

// ─── Query ───────────────────────────────────────────────────────
export const queryApi = {
  ask: (connection_id: string, question: string): Promise<{ data: QueryResponse }> =>
    api.post('/query/ask', { connection_id, question }),
};

// ─── History ─────────────────────────────────────────────────────
export const historyApi = {
  list: (params?: { connection_id?: string; limit?: number; offset?: number; saved_only?: boolean }) =>
    api.get<HistoryListResponse>('/history', { params }),
  save: (id: string, saved_name: string) => api.patch(`/history/${id}/save`, { saved_name }),
};

export default api;
