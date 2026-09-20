import { ApiResponse } from '../types/api';
import { User, LoginResponse } from '../types/auth';
import { Transaction, Budget, SavingsGoal, DashboardSummary } from '../types/finance';
import { Resource, ResourceReport } from '../types/resource';
import { FinancialDocument, FinancialArticle, NotificationItem } from '../types/education';

const API_BASE = '/api';

export function getAuthToken(): string | null {
  return localStorage.getItem('finova_token');
}

export function setAuthToken(token: string | null): void {
  if (token) {
    localStorage.setItem('finova_token', token);
  } else {
    localStorage.removeItem('finova_token');
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await res.json();

    if (res.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/register')) {
      // Clear token if invalid session
      setAuthToken(null);
      window.dispatchEvent(new Event('finova:unauthorized'));
    }

    if (!res.ok) {
      return {
        success: false,
        message: data.message || `Request failed with status ${res.status}`,
      };
    }

    return data;
  } catch (err: any) {
    console.error(`API Error on ${endpoint}:`, err);
    return {
      success: false,
      message: err?.message || 'Network connection failed. Please check server connection.',
    };
  }
}

export const api = {
  // Auth
  auth: {
    register: (data: any) =>
      request<LoginResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    login: (credentials: { email: string; password: string }) =>
      request<LoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      }),
    getMe: () => request<{ user: User }>('/auth/me'),
    deleteAccount: () => request<void>('/auth/me', { method: 'DELETE' }),
  },

  // Dashboard
  dashboard: {
    getSummary: () => request<DashboardSummary>('/dashboard/summary'),
  },

  // Transactions
  transactions: {
    getAll: (params?: { type?: string; category?: string; search?: string; page?: number; limit?: number }) => {
      const q = new URLSearchParams();
      if (params?.type) q.append('type', params.type);
      if (params?.category) q.append('category', params.category);
      if (params?.search) q.append('search', params.search);
      if (params?.page) q.append('page', String(params.page));
      if (params?.limit) q.append('limit', String(params.limit));
      return request<Transaction[]>(`/transactions?${q.toString()}`);
    },
    getById: (id: string) => request<Transaction>(`/transactions/${id}`),
    create: (data: Partial<Transaction>) =>
      request<Transaction>('/transactions', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<Transaction>) =>
      request<Transaction>(`/transactions/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<void>(`/transactions/${id}`, {
        method: 'DELETE',
      }),
  },

  // Budgets
  budgets: {
    getAll: () => request<Budget[]>('/budgets'),
    create: (data: Partial<Budget>) =>
      request<Budget>('/budgets', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<Budget>) =>
      request<Budget>(`/budgets/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<void>(`/budgets/${id}`, {
        method: 'DELETE',
      }),
  },

  // Savings Goals
  savings: {
    getAll: () => request<SavingsGoal[]>('/savings'),
    create: (data: Partial<SavingsGoal>) =>
      request<SavingsGoal>('/savings', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    addProgress: (id: string, amount: number) =>
      request<SavingsGoal>(`/savings/${id}/progress`, {
        method: 'POST',
        body: JSON.stringify({ amount }),
      }),
    update: (id: string, data: Partial<SavingsGoal>) =>
      request<SavingsGoal>(`/savings/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<void>(`/savings/${id}`, {
        method: 'DELETE',
      }),
  },

  // AI & Voice
  ai: {
    chat: (prompt: string, language?: string) =>
      request<{ reply: string; timestamp: string }>('/ai/chat', {
        method: 'POST',
        body: JSON.stringify({ prompt, language }),
      }),
    parseVoice: (transcript: string) =>
      request<any>('/ai/parse-voice', {
        method: 'POST',
        body: JSON.stringify({ transcript }),
      }),
  },

  // Resources
  resources: {
    getAll: (params?: { category?: string; verificationStatus?: string; search?: string }) => {
      const q = new URLSearchParams();
      if (params?.category) q.append('category', params.category);
      if (params?.verificationStatus) q.append('verificationStatus', params.verificationStatus);
      if (params?.search) q.append('search', params.search);
      return request<Resource[]>(`/resources?${q.toString()}`);
    },
    getNearby: (params: { lng: number; lat: number; radiusKm?: number; category?: string }) => {
      const q = new URLSearchParams({
        lng: String(params.lng),
        lat: String(params.lat),
      });
      if (params.radiusKm) q.append('radiusKm', String(params.radiusKm));
      if (params.category) q.append('category', params.category);
      return request<Resource[]>(`/resources/nearby?${q.toString()}`);
    },
    getById: (id: string) => request<Resource>(`/resources/${id}`),
    report: (id: string, data: { issueType: string; notes: string }) =>
      request<ResourceReport>(`/resources/${id}/report`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  // Documents
  documents: {
    getAll: (category?: string) => {
      const q = category && category !== 'ALL' ? `?category=${category}` : '';
      return request<FinancialDocument[]>(`/documents${q}`);
    },
    upload: (data: Partial<FinancialDocument>) =>
      request<FinancialDocument>('/documents', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getById: (id: string) => request<FinancialDocument>(`/documents/${id}`),
    delete: (id: string) =>
      request<void>(`/documents/${id}`, {
        method: 'DELETE',
      }),
  },

  // Notifications
  notifications: {
    getAll: () => request<NotificationItem[]>('/notifications'),
    markRead: (id: string) =>
      request<NotificationItem>(`/notifications/${id}/read`, {
        method: 'PUT',
      }),
    markAllRead: () =>
      request<void>('/notifications/read-all', {
        method: 'PUT',
      }),
  },

  // Education
  education: {
    getArticles: (category?: string, search?: string) => {
      const q = new URLSearchParams();
      if (category && category !== 'ALL') q.append('category', category);
      if (search) q.append('search', search);
      return request<FinancialArticle[]>(`/education/articles?${q.toString()}`);
    },
    getAll: (params?: { category?: string; search?: string }) => {
      const q = new URLSearchParams();
      if (params?.category && params.category !== 'ALL') q.append('category', params.category);
      if (params?.search) q.append('search', params.search);
      return request<FinancialArticle[]>(`/education/articles?${q.toString()}`);
    },
  },

  // Admin
  admin: {
    getStats: () => request<any>('/admin/stats'),
    getResources: () => request<Resource[]>('/resources'),
    verifyResource: (id: string, verificationStatus: string) =>
      request<Resource>(`/admin/resources/${id}/verification`, {
        method: 'PUT',
        body: JSON.stringify({ verificationStatus }),
      }),
    createResource: (data: any) =>
      request<Resource>('/admin/resources', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    updateResource: (id: string, data: any) =>
      request<Resource>(`/admin/resources/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    updateVerification: (id: string, verificationStatus: string) =>
      request<Resource>(`/admin/resources/${id}/verification`, {
        method: 'PUT',
        body: JSON.stringify({ verificationStatus }),
      }),
    archiveResource: (id: string, isArchived: boolean) =>
      request<Resource>(`/admin/resources/${id}/archive`, {
        method: 'PUT',
        body: JSON.stringify({ isArchived }),
      }),
    getReports: (status?: string) => {
      const q = status && status !== 'ALL' ? `?status=${status}` : '';
      return request<ResourceReport[]>(`/admin/reports${q}`);
    },
    resolveReport: (id: string, status: string, adminNotes?: string) =>
      request<ResourceReport>(`/admin/reports/${id}/resolve`, {
        method: 'PUT',
        body: JSON.stringify({ status, adminNotes }),
      }),
    createArticle: (data: any) =>
      request<FinancialArticle>('/admin/articles', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    updateArticle: (id: string, data: any) =>
      request<FinancialArticle>(`/admin/articles/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
  },
};
