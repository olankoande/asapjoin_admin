# BACKLOG — Endpoints API manquants pour l'admin

Ce fichier liste les endpoints backend qui n'existent pas encore mais seraient nécessaires pour compléter le backoffice admin.

## TODO API — Endpoints à créer côté backend

### 1. Admin Users
- **GET /api/v1/admin/users** — Liste tous les utilisateurs avec filtres (search, role, is_banned)
  - Query: `?search=&role=&is_banned=&page=&limit=`
  - Response: `User[]`
- **GET /api/v1/admin/users/:id** — Détail d'un utilisateur
  - Response: `User` (avec wallet, bookings count, trips count)
- **PATCH /api/v1/admin/users/:id/status** — Modifier statut utilisateur (ban/unban/role)
  - Body: `{ is_banned?: boolean, role?: string }`
  - Response: `User`

### 2. Admin Trips
- **GET /api/v1/admin/trips** — Liste tous les trajets avec filtres
  - Query: `?status=&driver_id=&page=&limit=`
  - Response: `Trip[]`

### 3. Admin Bookings
- **GET /api/v1/admin/bookings** — Liste toutes les réservations
  - Query: `?status=&passenger_id=&trip_id=&page=&limit=`
  - Response: `Booking[]`
- **POST /api/v1/admin/bookings/:id/cancel** — Annulation admin d'une réservation
  - Body: `{ reason: string }`
  - Response: `Booking`

### 4. Admin Deliveries
- **GET /api/v1/admin/deliveries** — Liste toutes les livraisons
  - Query: `?status=&sender_id=&page=&limit=`
  - Response: `Delivery[]`
- **POST /api/v1/admin/deliveries/:id/resolve-dispute** — Résoudre un litige livraison
  - Body: `{ resolution: string, refund_sender?: boolean }`
  - Response: `Delivery`

### 5. Admin Payments
- **GET /api/v1/admin/payments** — Liste tous les paiements
  - Query: `?status=&payer_id=&page=&limit=`
  - Response: `Payment[]`

### 6. Admin Refunds
- **GET /api/v1/admin/refunds** — Liste tous les remboursements
  - Query: `?status=&page=&limit=`
  - Response: `Refund[]`
- **POST /api/v1/admin/refunds** — Créer un remboursement admin
  - Body: `{ payment_id: string, amount: number, reason?: string }`
  - Response: `Refund`

### 7. Admin Wallet
- **GET /api/v1/admin/wallet/:userId** — Wallet d'un utilisateur
  - Response: `Wallet`
- **GET /api/v1/admin/wallet/:userId/transactions** — Transactions wallet
  - Query: `?page=&limit=`
  - Response: `WalletTransaction[]`
- **POST /api/v1/admin/wallet/adjustments** — Ajustement wallet admin
  - Body: `{ user_id: string, amount: number, type: "CREDIT"|"DEBIT", reason: string }`
  - Response: `WalletTransaction`

### 8. Admin Payouts (partiellement existant)
- **GET /api/v1/admin/payouts/eligible** — ✅ Existe
- **POST /api/v1/admin/payout-batches** — ✅ Existe
- **GET /api/v1/admin/payout-batches/:id** — ✅ Existe
- **POST /api/v1/admin/payout-batches/:id/execute** — ✅ Existe
- **POST /api/v1/admin/payouts/:id/retry** — ✅ Existe
- **POST /api/v1/admin/payouts/:id/mark-paid** — ✅ Existe
- **GET /api/v1/admin/payout-batches** — Liste tous les batches (historique)
  - Query: `?status=&page=&limit=`
  - Response: `PayoutBatch[]`

### 9. Admin Audit Logs
- **GET /api/v1/admin/audit-logs** — Liste les logs d'audit admin
  - Query: `?admin_id=&action=&target_type=&page=&limit=`
  - Response: `AuditLog[]`

### 10. Admin Webhooks / Anomalies
- **GET /api/v1/admin/stripe-events** — Liste les événements Stripe (pour debug)
  - Query: `?type=&page=&limit=`
  - Response: `StripeEvent[]`

## Notes
- Les endpoints marqués ✅ existent déjà dans le backend.
- Les autres doivent être implémentés dans `/backend/src/modules/admin/admin.routes.ts`.
- Chaque endpoint admin doit vérifier le rôle `admin` ou `support` via le middleware RBAC.
- Les actions sensibles (ban, refund, wallet adjust) doivent créer une entrée dans `admin_audit_logs`.
