# RENCI Website Update Form

An internal tool for RENCI staff to submit website change requests for projects and people. Requests are tracked as tickets on a Monday.com board and reviewed by the web team before any changes go live.

## What it does

Staff can submit requests to:
- **Add** a new project or person to the RENCI website
- **Update** an existing project or person
- **Archive** a project or person

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Vite + React, Mantine, React Hook Form |
| Backend | Node.js + Express |
| Auth | Backend-managed OIDC session |
| Ticket tracking | Monday.com |
| Data | GraphQL intermediate API over WordPress |

## Getting started

### Prerequisites

- Node.js 18+
- npm 9+
- Access to the RENCI VPN (required for GraphQL API and Monday.com)

### Local development

```bash
# Install dependencies
npm install

# Create separate env files once
cp .env.local.example .env.local
cp .env.production.example .env.production
# Fill in the required values in each file

# Start both frontend and backend with local settings
npm run dev
```

The app will be available at [http://localhost:5173](http://localhost:5173).

`Makefile` commands default to `.env.local` for local work. `make deploy` automatically reads from `.env.production`, so you do not need to swap `PUBLIC_BASE_URL` back and forth.

### Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for instructions on building and running the app.

## Project structure

```
/
├── frontend/         # Vite + React app
│   └── src/
│       ├── components/
│       │   ├── form-elements/   # Pure UI input wrappers
│       │   └── form-blocks/     # RHF-aware shared components
│       ├── pages/               # Route-level page components
│       ├── hooks/               # Custom React hooks
│       └── context/             # React context providers
├── backend/          # Node + Express API
│   ├── routes/       # API route handlers
│   ├── services/     # GraphQL and Monday.com clients
│   └── schemas/      # Request validation schemas
├── .env.example      # Required environment variables
├── DOCKER.md         # Docker setup and usage
└── README.md
```

## Environment variables

Copy `.env.example` to `.env` and fill in the required values. See `.env.example` for descriptions of each variable.

Authentication is handled by the Express backend. The browser talks only to this app's own `/auth/*` and `/api/*` routes; the backend performs the OIDC flow with the identity provider and issues an `HttpOnly` session cookie.

## VPN requirement

The backend connects to the RENCI GraphQL API and Monday.com, both of which require VPN access. The app will return a `503` error with a VPN prompt if the connection cannot be established.
