// ─── Admin Dispute Types (based on backend disputes.service.ts + disputes.routes.ts) ───

export type DisputeKind = 'booking' | 'delivery';

export type DisputeStatus = 'open' | 'investigating' | 'resolved_refund' | 'resolved_release' | 'resolved_split' | 'closed';

export interface AdminDispute {
  id: string;
  kind: DisputeKind;
  reference_id: string;
  opened_by: string;
  reason: string;
  status: DisputeStatus;
  hold_amount_cents: number;
  resolved_by: string | null;
  resolved_at: string | null;
  resolution_note: string | null;
  created_at: string;
  updated_at: string;
}

export type ResolveOutcome = 'refund_customer' | 'release_to_driver' | 'split';

export interface ResolveDisputeInput {
  outcome: ResolveOutcome;
  refund_amount_cents?: number;
  release_amount_cents?: number;
  note?: string;
}

export interface ResolveDisputeResult {
  id: string;
  status: string;
  outcome: ResolveOutcome;
}

// ─── Status labels ───

export const DISPUTE_STATUS_LABELS: Record<string, string> = {
  open: 'Ouvert',
  investigating: 'En investigation',
  resolved_refund: 'Résolu — Remboursé',
  resolved_release: 'Résolu — Fonds libérés',
  resolved_split: 'Résolu — Partage',
  closed: 'Fermé',
};

export const DISPUTE_STATUS_COLORS: Record<string, 'warning' | 'info' | 'success' | 'error' | 'default'> = {
  open: 'warning',
  investigating: 'info',
  resolved_refund: 'success',
  resolved_release: 'success',
  resolved_split: 'success',
  closed: 'default',
};

// ─── Error messages for admin ───

export const ADMIN_DISPUTE_ERROR_MESSAGES: Record<string, string> = {
  DISPUTE_NOT_FOUND: 'Litige introuvable.',
  DISPUTE_NOT_OPEN: 'Ce litige n\'est plus ouvert.',
  DISPUTE_ALREADY_RESOLVED: 'Ce litige a déjà été résolu.',
  INVALID_OUTCOME: 'Issue de résolution invalide.',
  FORBIDDEN: 'Accès non autorisé.',
};
