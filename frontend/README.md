# GrowLine frontend

React + Vite web app with two areas in one site:

- **Extension Agent** (`/agent/...`): overview, farmers, farms, spray advisory, SMS history, notifications, complaints, profile.
- **Super Admin** (`/admin/...`): operations overview, extension agents and invitations, farmers, farms, SMS monitoring, reports, complaints, notifications, settings.

Screens follow the Figma file (`FINAL SCREENS` page) and its Design System v1.0.

## Run it locally

You need [Node.js](https://nodejs.org) (version 20.19 or newer; the current LTS release is fine).

```bash
cd frontend
npm install
npm run dev
```

Then open the address Vite prints (usually http://localhost:5173).

- Agent sign-in: http://localhost:5173/login
- Super Admin sign-in: http://localhost:5173/admin/login

## Sample data or the real backend

The app reads everything through `src/api/index.js`. Which source it uses depends on `VITE_API_URL`:

- **Empty or not set:** sample data from `src/mocks/data.js`. Any email and password sign in, and the password `wrong` shows the failed-login screens.
- **Set to the backend address** (copy `.env.example` to `.env.local`): real sign-in and live data on the connected pages. Use a real account from the backend engineer. The backend test deployment is listed in the backend repo's `docs.md`.

Restart `npm run dev` after changing `.env.local`. Only put public values in `VITE_*` variables: they are built into the JavaScript and visible to everyone.

### What is connected to the backend

Endpoints come from the backend repo (`GlowLine-Agroapp/backend`, branch `staging`).

| Page | Endpoint |
|---|---|
| Sign in (both areas) | `POST /login/`, `POST /logout/` |
| Admin: Extension Agents, agent profile | `/superadmin/agent-list/`, `/superadmin/agent/<id>/` |
| Admin: invitations | `/superadmin/agent-invite-list/` |
| Admin: farmers, farmer profile | `/superadmin/farmers/`, `farmers/stats/`, `farmers/<id>/` |
| Admin: farms, farm detail | `/superadmin/farms/`, `farms/<id>/` |

Every other page still shows sample data. When the backend is in use those pages show a "Sample data" strip at the top, so nobody mistakes them for live numbers.

### How sign-in works

- The login response has no role, so after logging in the app asks an admin-only endpoint (`/superadmin/farmers/stats/`): `200` means Super Admin, `403` means anyone else. Signing in on the wrong page shows a message instead of letting the user through.
- Tokens are kept in the browser (`localStorage`) and sent as `Authorization: Bearer <token>`. If the server answers `401` the user is signed out and sent to the sign-in page.
- There is no token refresh yet: the backend does not expose a refresh route. When the 1-day access token expires, users sign in again.
- "Attempts remaining" on the admin sign-in is display only. The backend does not report or enforce an attempt count.

### Adding another endpoint

1. In `src/api/adapters.js`, add a small function that turns the backend's response into the shape the page uses.
2. In `src/api/index.js`, change the matching `sample(...)` entry into `live(realCall, sampleVersion)`.
3. Add the page's path to `CONNECTED_PAGES` in `src/layouts/AppLayout.jsx` so the "Sample data" strip disappears.

## Layout of `src/`

```
styles/       tokens.css (design tokens) and global.css
components/   Button, Card, DataTable, FormField, Modal, StatCard, StatusPill, GpsCapture, ...
layouts/      AppLayout (sidebar), AuthShell (sign-in pages)
auth/         sign-in logic, session and role guard (RequireRole)
api/          request helper, adapters and the single list of calls
mocks/        sample data
pages/        auth/, agent/, admin/
```

## Deploying on Render (static site)

- Root directory: `frontend`
- Build command: `npm install && npm run build`
- Publish directory: `dist`
- Rewrite rule: source `/*`, destination `/index.html`, action **Rewrite** (needed for refreshes on deep links)
- Environment variable: `VITE_API_URL` = the backend address (the Render backend, once deployed)

## Still open

- The agent `Alert Monitoring` page has no design yet, so it is a placeholder.
- Most pages wait for backend endpoints (agent area, overview, SMS monitoring, reports, complaints, notifications, activation and password reset).
- The backend needs to add a `role` to the login response and expose a token-refresh route.
- Status names and ID formats need to be agreed with the designer and backend (the backend uses `FMR-`, `FM-`, `AGT-`, `ALT-`).
- The agent `My Profile` and `Complaints & Help` pages exist in two versions in Figma; the simpler ones were built.
- Sidebar icons are general-purpose line icons, not the exact artwork from Figma.
