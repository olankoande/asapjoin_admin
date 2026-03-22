# AsapJoin Admin — Backoffice

Module d'administration pour la plateforme AsapJoin (covoiturage + livraison de colis).

## Stack

- React 19 + TypeScript + Vite
- MUI (Material UI) v7
- React Router v7
- TanStack Query (react-query) v5
- React Hook Form + Zod
- Axios (HTTP client avec JWT auto-refresh)
- React Hot Toast (notifications)

## Installation

```bash
cd admin
npm install
cp .env.example .env   # Configurer l'URL de l'API
npm run dev             # Démarre sur http://localhost:5174
```

## Configuration (.env)

```env
VITE_API_BASE_URL=http://localhost:3000/api/v1
VITE_APP_NAME=AsapJoin Admin
```

## Pages disponibles

| Page | Route | Description |
|------|-------|-------------|
| Dashboard | `/` | Accueil + liens rapides |
| Utilisateurs | `/users` | Liste, recherche, ban/unban |
| Trajets | `/trips` | Liste, dépublier |
| Réservations | `/bookings` | Liste des bookings |
| Livraisons | `/deliveries` | Liste des deliveries |
| Paiements | `/payments` | Liste des payments Stripe |
| Remboursements | `/refunds` | Créer/lister refunds |
| Wallet | `/wallet` | Recherche wallet par user, ajustements |
| Politiques | `/policies` | CRUD politiques d'annulation |
| Payouts | `/payouts` | Éligibles, créer/exécuter batch |
| Signalements | `/reports` | Traiter signalements |
| Audit Logs | `/audit-logs` | Historique actions admin |

## Auth

- Login admin via `/login` (rôle `admin` ou `support` requis)
- JWT access + refresh token automatique
- Toutes les routes protégées via `RequireAuth`

## Sécurité

- RBAC strict : seuls les rôles `admin` et `support` peuvent accéder
- Confirmation modale pour toutes les actions sensibles (ban, refund, wallet adjust, payout execute)
- Erreurs API affichées proprement avec code + message

## Endpoints manquants

Voir [BACKLOG.md](./BACKLOG.md) pour la liste des endpoints backend à implémenter.

## Build production

```bash
npm run build    # Génère dans /dist
npm run preview  # Preview du build
```
