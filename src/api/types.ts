// ─── API Types ───
export interface ApiError {
  code: string;
  message: string;
  traceId?: string;
  details?: unknown[];
}

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string | null;
  avatar_url: string | null;
  role: 'user' | 'support' | 'admin';
  is_banned: boolean;
  email_verified?: boolean;
  auth_provider?: 'local' | 'google';
  google_sub?: string | null;
  payout_email: string | null;
  current_contract_version?: string | null;
  accepted_contract_version?: string | null;
  contract_accepted_at?: string | null;
  contract_acceptance_required?: boolean;
  created_at: string;
  updated_at: string;
}

export interface Permission {
  id: string;
  module: string;
  action: string;
  code: string;
  description: string | null;
  assigned?: boolean;
}

export interface Role {
  id: string;
  name: string;
  code: string;
  description: string | null;
  is_system: boolean;
  created_at: string;
  updated_at: string;
  _count?: {
    user_roles: number;
    role_permissions: number;
  };
  role_permissions?: Array<{
    permission: Permission;
  }>;
  assigned?: boolean;
}

export interface UserRolesPayload {
  user: Pick<User, 'id' | 'email' | 'first_name' | 'last_name'>;
  roles: Role[];
}

export interface Vehicle {
  id: string;
  owner_id: string;
  brand: string;
  model: string;
  color: string;
  plate_number: string;
  year: number;
  seats: number;
  photo_url: string | null;
}

export interface Trip {
  id: string;
  driver_id: string;
  vehicle_id: string;
  // DB fields (actual Prisma column names)
  from_city: string;
  to_city: string;
  from_address: string | null;
  to_address: string | null;
  from_lat: number | null;
  from_lng: number | null;
  to_lat: number | null;
  to_lng: number | null;
  departure_at: string;
  // Aliases kept for backward compat
  origin_address?: string;
  destination_address?: string;
  departure_time?: string;
  estimated_arrival: string | null;
  available_seats: number;
  price_per_seat: number;
  accepts_parcels: boolean;
  parcel_base_price: number | null;
  parcel_price?: number | null;
  status: 'draft' | 'published' | 'in_progress' | 'completed' | 'cancelled';
  notes: string | null;
  created_at: string;
  driver?: User;
  vehicle?: Vehicle;
}

export interface Booking {
  id: string;
  trip_id: string;
  passenger_id: string;
  seats_booked: number;
  total_price: number;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'completed';
  cancelled_by: string | null;
  cancellation_reason: string | null;
  created_at: string;
  trip?: Trip;
  passenger?: User;
}

export interface Delivery {
  id: string;
  trip_id: string;
  sender_id: string;
  receiver_id: string | null;
  total_price: number;
  status: 'pending' | 'accepted' | 'rejected' | 'in_transit' | 'delivered' | 'confirmed' | 'cancelled';
  pickup_address: string | null;
  dropoff_address: string | null;
  created_at: string;
  trip?: Trip;
  sender?: User;
  parcels?: Parcel[];
}

export interface Parcel {
  id: string;
  delivery_id: string;
  description: string;
  weight_kg: number | null;
  length_cm: number | null;
  width_cm: number | null;
  height_cm: number | null;
  photo_url: string | null;
}

export interface Payment {
  id: string;
  payer_id: string;
  booking_id: string | null;
  delivery_id: string | null;
  stripe_payment_intent: string;
  amount: number;
  currency: string;
  status: 'pending' | 'succeeded' | 'failed' | 'refunded';
  created_at: string;
  payer?: User;
}

export interface Refund {
  id: string;
  payment_id: string;
  amount: number;
  reason: string | null;
  status: string;
  created_at: string;
}

export interface Wallet {
  id: string;
  user_id: string;
  pending_balance: number;
  available_balance: number;
  currency: string;
  user?: User;
}

export interface WalletTransaction {
  id: string;
  wallet_id: string;
  type: string;
  amount: number;
  balance_after: number;
  reference_id: string | null;
  reference_type: string | null;
  description: string | null;
  created_at: string;
}

export interface CancellationPolicy {
  id: string;
  name: string;
  scope: 'booking' | 'delivery';
  active: boolean;
  created_by_admin_id: string | null;
  updated_by_admin_id: string | null;
  created_at: string;
  updated_at: string;
  rules: CancellationPolicyRule[];
}

export interface CancellationPolicyRule {
  id: string;
  policy_id: string;
  min_hours_before_departure: number;
  cancellation_fee_fixed: number;
  cancellation_fee_percent: number;
  refund_percent_to_payer: number;
  debit_driver_percent: number;
  apply_after_min_delay_hours: number;
  created_at: string;
  updated_at: string;
}

export interface PayoutBatch {
  id: string;
  scheduled_for_date: string;
  status: 'draft' | 'ready' | 'processing' | 'paid' | 'failed' | 'cancelled';
  created_by_admin_id: string | null;
  created_at: string;
  updated_at: string;
  payouts?: Payout[];
}

export interface Payout {
  id: string;
  batch_id: string;
  user_id: string;
  amount: number;
  currency: string;
  destination?: string | null;
  status: 'queued' | 'sent' | 'paid' | 'failed';
  failure_reason: string | null;
  created_at?: string;
  updated_at?: string;
  users?: Pick<User, 'id' | 'email' | 'first_name' | 'last_name' | 'payout_email'> & { payout_phone?: string | null };
  batch?: Pick<PayoutBatch, 'id' | 'scheduled_for_date' | 'status'>;
}

export interface PayoutEligible {
  user_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone_number: string | null;
  payout_email: string | null;
  payout_phone?: string | null;
  available_cents: number;
  available_dollars: number;
  wallet_id: string;
  eligible: boolean;
  missing_info: string[];
  as_of_date?: string | null;
}

export interface ContractDocument {
  id: string;
  title: string;
  version: string;
  content: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Report {
  id: string;
  reporter_id: string;
  reported_id?: string;
  target_id?: string;
  target_type?: string;
  reason: string;
  status: 'open' | 'pending' | 'resolved' | 'dismissed';
  resolution: string | null;
  resolved_by: string | null;
  created_at: string;
  reporter?: User;
  reported?: User;
}

export interface AuditLog {
  id: string;
  admin_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details_json: string | null;
  created_at: string;
  admin?: { id: string; first_name: string; last_name: string; email: string };
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  user: User;
}
