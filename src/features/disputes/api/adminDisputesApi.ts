import http from '../../../api/httpClient';
import type { AdminDispute, ResolveDisputeInput, ResolveDisputeResult } from '../types/adminDispute.types';

export interface DisputeReply {
  id: string;
  dispute_id: string;
  user_id: string;
  user_role: string;
  message: string;
  created_at: string;
  user?: { first_name: string; last_name: string; avatar_url: string | null };
}

export interface AdminDisputeDetail extends AdminDispute {
  replies?: DisputeReply[];
  opener?: { first_name: string; last_name: string; email: string };
}

export const adminDisputesApi = {
  /** List all disputes — GET /api/v1/disputes/admin */
  list: (params?: Record<string, string>) =>
    http.get<{ disputes: AdminDispute[] }>('/disputes/admin', { params }),

  /** Get dispute detail — GET /api/v1/disputes/admin/:id */
  get: (id: string) =>
    http.get<AdminDisputeDetail>(`/disputes/admin/${id}`),

  /** Update dispute status — PATCH /api/v1/disputes/admin/:id/status */
  updateStatus: (id: string, status: string) =>
    http.patch<{ id: string; status: string }>(`/disputes/admin/${id}/status`, { status }),

  /** Resolve dispute — POST /api/v1/disputes/admin/:id/resolve */
  resolve: (id: string, body: ResolveDisputeInput) =>
    http.post<ResolveDisputeResult>(`/disputes/admin/${id}/resolve`, body),

  /** Reply to dispute — POST /api/v1/disputes/admin/:id/reply */
  reply: (id: string, message: string) =>
    http.post<DisputeReply>(`/disputes/admin/${id}/reply`, { message }),
};

// ─── Cancellation Requests API ───

export interface CancellationRequest {
  id: string;
  resource_type: 'booking' | 'delivery';
  resource_id: string;
  actor_user_id: string;
  actor_role: string;
  reason: string | null;
  original_amount_cents: number;
  calculated_refund_cents: number;
  calculated_fee_cents: number;
  driver_reversal_cents: number;
  commission_reversal_cents: number;
  driver_compensation_cents: number;
  policy_id: string | null;
  status: string;
  stripe_refund_id: string | null;
  refund_id: string | null;
  is_admin_override: boolean;
  created_at: string;
  processed_at: string | null;
}

export interface RefundOverrideInput {
  resource_type: 'booking' | 'delivery';
  resource_id: string;
  refund_amount_cents: number;
  reason?: string;
}

export const adminCancellationsApi = {
  /** List cancellation requests — GET /api/v1/admin/cancellation-requests */
  list: (params?: Record<string, string>) =>
    http.get<CancellationRequest[]>('/admin/cancellation-requests', { params }),

  /** Admin refund override — POST /api/v1/admin/refunds/override */
  refundOverride: (body: RefundOverrideInput) =>
    http.post('/admin/refunds/override', body),

  /** List refund policies — GET /api/v1/admin/refund-policies */
  listPolicies: (params?: Record<string, string>) =>
    http.get('/admin/refund-policies', { params }),

  /** Create refund policy — POST /api/v1/admin/refund-policies */
  createPolicy: (body: Record<string, unknown>) =>
    http.post('/admin/refund-policies', body),

  /** Update refund policy — PATCH /api/v1/admin/refund-policies/:id */
  updatePolicy: (id: string, body: Record<string, unknown>) =>
    http.patch(`/admin/refund-policies/${id}`, body),

  /** Activate refund policy — POST /api/v1/admin/refund-policies/:id/activate */
  activatePolicy: (id: string) =>
    http.post(`/admin/refund-policies/${id}/activate`),

  /** Deactivate refund policy — POST /api/v1/admin/refund-policies/:id/deactivate */
  deactivatePolicy: (id: string) =>
    http.post(`/admin/refund-policies/${id}/deactivate`),
};
