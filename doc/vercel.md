# Deploy ShareBoard on Vercel

This guide covers deploying the ShareBoard Next.js app to [Vercel](https://vercel.com/). **Production** uses [Turso](https://turso.tech/) (libSQL) for persistent data; local development keeps using a SQLite file under `./data/`.

## Before you deploy

| Requirement | Notes |
|-------------|--------|
| **Git repository** | Push the project to GitHub, GitLab, or Bitbucket. Vercel imports from Git. |
| **Node.js 22.x or 24.x** | Matches `engines` in `package.json` (`>=22 <26`). In Vercel **Settings → General → Node.js Version**, choose **22.x** or **24.x** — not an open-ended range that resolves to **26.x** (breaks `better-sqlite3`). |
| **Turso database** | Create a DB in the Turso dashboard or CLI; copy URL + auth token. |
| **`AUTH_SECRET`** | At least 16 characters. Generate with `openssl rand -base64 32`. |

The repo sets `serverExternalPackages: ["better-sqlite3"]` in `next.config.ts` for local SQLite only; Turso uses `@libsql/client` over HTTPS.

## Turso setup

1. Install the [Turso CLI](https://docs.turso.tech/cli) and sign in, or use the Turso web console.
2. Create a database, for example `shareboard`.
3. Get the URL and token:

```bash
turso db show shareboard --url
turso db tokens create shareboard
```

4. Add `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` to Vercel (see below). Schema tables are created automatically on first API request (`src/lib/schema.ts`).

When `NODE_ENV=production` and both Turso variables are set, the app **does not** use the local SQLite file on disk.

## Environment variables

In the Vercel project: **Settings → Environment Variables**. Add these for **Production** (and **Preview** if branch previews should share the same DB):

| Name | Example | Description |
|------|---------|-------------|
| `AUTH_SECRET` | *(random 32+ byte string)* | Signs session cookies. Must be ≥ 16 characters. |
| `TURSO_DATABASE_URL` | `libsql://shareboard-….turso.io` | From `turso db show … --url` |
| `TURSO_AUTH_TOKEN` | *(token string)* | From `turso db tokens create …` |

`DATABASE_PATH` is optional on Vercel when Turso is configured (used only if Turso vars are missing).

## SQLite on Vercel (fallback only)

If Turso env vars are **not** set in production, the app falls back to a SQLite file (`DATABASE_PATH`, remapped to `/tmp/…` on Vercel). That storage is **ephemeral** — not suitable for a real board. Prefer Turso.

Do **not** commit production secrets. Vercel injects env vars at build and runtime; local `.env` is gitignored.

`NODE_ENV` is set automatically by Vercel (`production` on Production deployments).

## Deploy from the Vercel dashboard

1. Sign in at [vercel.com](https://vercel.com/) and click **Add New… → Project**.
2. Import your **ShareBoard** Git repository.
3. **Framework Preset:** Next.js (auto-detected).
4. **Build Command:** `npm run build` (default).
5. **Output Directory:** must be **empty** (override **off**). Do not set `public` — that is for static sites, not Next.js.
6. **Install Command:** `npm install` (default).
7. Add [environment variables](#environment-variables).
8. Click **Deploy**.

After the build finishes, open the deployment URL, **register** a User ID, and sign in to the studio (**Board**, **Share with**, **Settings**).

## Deploy with the Vercel CLI

```bash
npm i -g vercel
cd /path/to/ShareBoard
vercel login
vercel
```

Follow the prompts to link the project. Set env vars:

```bash
vercel env add AUTH_SECRET production
vercel env add DATABASE_PATH production
```

Deploy to production:

```bash
vercel --prod
```

## Build settings reference

| Setting | Value |
|---------|--------|
| Framework | Next.js |
| Node.js version | 20.x (Project Settings → General → Node.js Version) |
| Build command | `npm run build` |
| Dev command (local) | `npm run dev` |

The repo includes `vercel.json` with `"framework": "nextjs"` so Vercel uses the Next.js builder instead of a static `public` output folder.

## Post-deploy checklist

- [ ] Open `/register`, create a test user, then sign in.
- [ ] Create a board post and confirm it appears on **Board**.
- [ ] Toggle **Share with** for another user and confirm visibility rules.
- [ ] Confirm `AUTH_SECRET` is unique per environment (Production vs Preview).
- [ ] If using `/tmp` for SQLite, accept that data is not durable; plan a persistent host or DB migration for real use.

## Custom domain (optional)

1. Project **Settings → Domains**.
2. Add your domain and follow DNS instructions.
3. Redeploy if needed; HTTPS is provisioned by Vercel.

Session cookies work on the default `*.vercel.app` host and on custom domains without extra app config.

## Troubleshooting

### `STATIC_BUILD_NO_OUT_DIR` / No Output Directory named `public`

The Next.js build **succeeded**, but Vercel is treating the project as a **static** site and expecting a `public` build output folder.

1. Open the project on Vercel → **Settings** → **Build and Deployment**.
2. Set **Framework Preset** to **Next.js**.
3. Under **Build & Development Settings**, turn **off** the override for **Output Directory**, or clear the field so it is blank (not `public` or `.next`).
4. **Build Command** should be `npm run build` (or default).
5. Redeploy (**Deployments** → latest → **Redeploy**).

After pulling the latest repo, `vercel.json` also declares `"framework": "nextjs"` to reduce mis-detection on import.

### Build fails on `better-sqlite3`

- Ensure **Node 22.x or 24.x** is selected in Vercel and `engines.node` stays below 26 (not open-ended `>=20`).
- Confirm `next.config.ts` includes `serverExternalPackages: ["better-sqlite3"]`.
- Check the build log for native compile errors; retry after clearing the build cache (**Deployments → … → Redeploy** with cache cleared).

### `AUTH_SECRET must be set`

Add `AUTH_SECRET` in Vercel environment variables for the target environment (Production / Preview), redeploy, and ensure the value is at least 16 characters.

### Sign-in works locally but not on Vercel

- `AUTH_SECRET` must be set on Vercel and must stay **stable** across deploys (changing it invalidates existing sessions).
- Use the same deployment URL you registered on (cookie scope).

### Data disappears after redeploy or between users

Expected when using ephemeral storage or `/tmp`. Move to a persistent server or external database for lasting data.

### Login suddenly fails (“Invalid User ID or password”) after it worked yesterday

Two separate issues are common on Vercel:

1. **Ephemeral database** — Users and posts live in `/tmp/...` (or a remapped path). After a **cold start**, **redeploy**, or a **new serverless instance**, that file can be **empty**. Your account from yesterday is not on that instance, so login correctly returns “invalid credentials.” **Register again** on the new instance, or host on a machine with persistent disk.

2. **SQLite + warm lambdas (fixed in app code)** — A single global `better-sqlite3` connection on a reused function caused **300s timeouts**, `Statement::~Statement()` crashes, and `SIGABRT` in logs. API routes now use **one connection per request** (`runWithDb` / `withDbHandler`). Deploy the latest code if you still see those errors.

### `Task timed out after 300 seconds` on `/api/auth/login`

Usually **SQLite lock** or a **stuck native crash** from reusing one DB connection across concurrent requests on the same function instance. Update to the latest commit with per-request DB handling and redeploy.

## Related docs

- [README](../README.md) — local development, API reference, production on a long-running server
- [.env.example](../.env.example) — variable names and comments
