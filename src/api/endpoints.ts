import http from './httpClient';
import type { User, Trip, Booking, Delivery, Payment, Refund, Wallet, WalletTransaction, CancellationPolicy, PayoutBatch, PayoutEligible, Report, AuditLog, TokenPair, Payout, ContractDocument } from './types';

// ─── Auth ───
export const authApi = {
  login: (email: string, password: string) => http.post<TokenPair>('/auth/login', { email, password }),
  refresh: (refreshToken: string) => http.post<TokenPair>('/auth/refresh', { refreshToken }),
  me: () => http.get<{ user: User }>('/auth/me'),
  mePermissions: () => http.get<{ permissions: string[] }>('/me/permissions'),
  meRoles: () => http.get<{ roles: string[] }>('/me/roles'),
};

// ─── Admin Users ───
export interface CreateUserInput {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
  role: string;
}

export interface UpdateUserInput {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone_number?: string;
  payout_email?: string;
  role?: string;
  is_banned?: boolean;
  bio?: string;
  password?: string;
}

export const usersApi = {
  list: (params?: Record<string, string>) => http.get<User[]>('/admin/users', { params }),
  get: (id: string) => http.get<User>(`/admin/users/${id}`),
  create: (body: CreateUserInput) => http.post<User>('/admin/users', body),
  update: (id: string, body: UpdateUserInput) => http.patch<User>(`/admin/users/${id}`, body),
  updateStatus: (id: string, body: { is_banned?: boolean; role?: string }) => http.patch(`/admin/users/${id}/status`, body),
};

// ─── Admin Trips ───
export const tripsApi = {
  list: (params?: Record<string, string>) => http.get<Trip[]>('/admin/trips', { params }),
  get: (id: string) => http.get<Trip>(`/trips/${id}`),
  unpublish: (id: string) => http.patch(`/trips/${id}/unpublish`),
};

// ─── Admin Bookings ───
export const bookingsApi = {
  list: (params?: Record<string, string>) => http.get<Booking[]>('/admin/bookings', { params }),
  get: (id: string) => http.get<Booking>(`/bookings/${id}`),
};

// ─── Admin Deliveries ───
export const deliveriesApi = {
  list: (params?: Record<string, string>) => http.get<Delivery[]>('/admin/deliveries', { params }),
  get: (id: string) => http.get<Delivery>(`/deliveries/${id}`),
};

// ─── Admin Payments ───
export const paymentsApi = {
  list: (params?: Record<string, string>) => http.get<Payment[]>('/admin/payments', { params }),
  get: (id: string) => http.get<Payment>(`/payments/${id}`),
};

// ─── Admin Refunds ───
export const refundsApi = {
  list: (params?: Record<string, string>) => http.get<Refund[]>('/admin/refunds', { params }),
  create: (body: { payment_id: string; amount: number; reason?: string }) => http.post<Refund>('/admin/refunds', body),
};

// ─── Admin Wallet ───
export const walletApi = {
  getByUser: (userId: string) => http.get<Wallet>(`/admin/wallet/${userId}`),
  getTransactions: (userId: string, params?: Record<string, string>) => http.get<WalletTransaction[]>(`/admin/wallet/${userId}/transactions`, { params }),
  adjust: (body: { user_id: string; amount: number; type: string; reason: string }) => http.post('/admin/wallet/adjustments', body),
};

// ─── Admin Policies ───
export const policiesApi = {
  list: () => http.get<CancellationPolicy[]>('/admin/policies/cancellation'),
  create: (body: Partial<CancellationPolicy>) => http.post<CancellationPolicy>('/admin/policies/cancellation', body),
  update: (id: string, body: Partial<CancellationPolicy>) => http.patch<CancellationPolicy>(`/admin/policies/cancellation/${id}`, body),
  activate: (id: string) => http.post(`/admin/policies/cancellation/${id}/activate`),
  addRule: (policyId: string, body: Record<string, unknown>) => http.post<CancellationPolicy>(`/admin/policies/cancellation/${policyId}/rules`, body),
  updateRule: (policyId: string, ruleId: string, body: Record<string, unknown>) => http.patch<CancellationPolicy>(`/admin/policies/cancellation/${policyId}/rules/${ruleId}`, body),
  deleteRule: (policyId: string, ruleId: string) => http.delete(`/admin/policies/cancellation/${policyId}/rules/${ruleId}`),
};

// ─── Admin Payouts ───
export const payoutsApi = {
  eligible: (asOfDate?: string) => http.get<PayoutEligible[]>('/admin/eligible', { params: asOfDate ? { asOfDate } : {} }),
  batches: (params?: { scheduledFor?: string; status?: string }) => http.get<PayoutBatch[]>('/admin/payout-batches', { params }),
  payouts: (params?: { scheduledFor?: string; status?: string }) => http.get<Payout[]>('/admin/payouts', { params }),
  createBatch: (body: { scheduled_for: string; user_ids?: string[]; provider?: string; notes?: string }) => http.post<PayoutBatch>('/admin/payout-batches', body),
  getBatch: (id: string) => http.get<PayoutBatch>(`/admin/payout-batches/${id}`),
  executeBatch: (id: string) => http.post<PayoutBatch>(`/admin/payout-batches/${id}/execute`),
  retryPayout: (id: string) => http.post(`/admin/payouts/${id}/retry`),
  markPaid: (id: string, providerReference?: string) => http.post(`/admin/payouts/${id}/mark-paid`, { providerReference }),
  markFailed: (id: string, reason?: string) => http.post(`/admin/payouts/${id}/mark-failed`, { reason }),
};

// ─── Admin Reports ───
export const reportsApi = {
  list: (params?: Record<string, string>) => http.get<Report[]>('/admin/reports', { params }),
  resolve: (id: string, body: { status: string; resolution?: string }) => http.post(`/admin/reports/${id}/resolve`, body),
};

// ─── Admin Audit Logs ───
export const auditLogsApi = {
  list: (params?: Record<string, string>) => http.get<AuditLog[]>('/admin/audit-logs', { params }),
};

// ─── Admin Settings (Pricing / Margins) ───
export const settingsApi = {
  get: () => http.get<any>('/admin/settings'),
  update: (body: Record<string, any>) => http.put<any>('/admin/settings', body),
};

export const contractsApi = {
  current: () => http.get<ContractDocument | null>('/admin/contracts/current'),
  list: () => http.get<ContractDocument[]>('/admin/contracts'),
  saveCurrent: (body: { title: string; version: string; content: string }) => http.put<ContractDocument>('/admin/contracts/current', body),
};

// ─── Admin Ledger & Commissions ───
export const ledgerApi = {
  list: (params?: Record<string, string>) => http.get<any>('/admin/ledger', { params }),
  summary: () => http.get<any>('/admin/ledger/summary'),
};
