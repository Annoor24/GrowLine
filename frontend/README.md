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

## Sample sign-in (mock)

There is no backend login yet. Any email and password work, and the password `wrong` shows the failed-login screens.

- Agent: http://localhost:5173/login
- Super Admin: http://localhost:5173/admin/login

Other screens you can open directly: `/activate/abc` (agent activation), `/activate/expired`, `/admin/forgot-password`, `/admin/session-expired`.

## Mock data and the real API

All screens read data through `src/api/index.js`.

- With `VITE_API_URL` empty (the default) the app uses the sample data in `src/mocks/data.js`.
- Set `VITE_API_URL` to the backend address to call the real API. The paths in `src/api/index.js` are **provisional** until the backend engineer confirms the routes and response shapes.
- Put public values only in `VITE_*` variables. They are built into the JavaScript and visible to everyone. Never put keys or passwords there.

Copy `.env.example` to `.env.local` for local settings.

## Layout of `src/`

```
styles/       tokens.css (design tokens) and global.css
components/   Button, Card, DataTable, FormField, Modal, StatCard, StatusPill, GpsCapture, ...
layouts/      AppLayout (sidebar), AuthShell (sign-in pages)
auth/         mock session + role guard (RequireRole)
api/          API client and the single list of calls
mocks/        sample data
pages/        auth/, agent/, admin/
```

## Deploying on Render (static site)

- Root directory: `frontend`
- Build command: `npm install && npm run build`
- Publish directory: `dist`
- Rewrite rule: source `/*`, destination `/index.html`, action **Rewrite** (needed for refreshes on deep links)
- Environment variable: `VITE_API_URL` = the backend address

## Still open

- The agent `Alert Monitoring` page has no design yet, so it is a placeholder.
- The API paths in `src/api/index.js` are guesses until the backend engineer confirms them.
- Status names and ID formats (FRM-, FARM-, ALT-, AGT-) need to be agreed with the designer and backend.
- The agent `My Profile` and `Complaints & Help` pages exist in two versions in Figma; the simpler ones were built.
- Sidebar icons are general-purpose line icons, not the exact artwork from Figma.
