# Deploy ShareBoard on Vercel

This guide covers deploying the ShareBoard Next.js app to [Vercel](https://vercel.com/). Use it for previews and small demos; for a friends-and-family board with **reliable, persistent data**, prefer a host with a writable disk (VPS, Railway, Fly.io, etc.)—see [Production](../README.md#production) in the main README.

## Before you deploy

| Requirement | Notes |
|-------------|--------|
| **Git repository** | Push the project to GitHub, GitLab, or Bitbucket. Vercel imports from Git. |
| **Node.js 20+** | Matches `engines` in `package.json`. Set in Vercel project settings if needed. |
| **`AUTH_SECRET`** | At least 16 characters. Generate with `openssl rand -base64 32`. **Required** in Vercel; do not use the dev placeholder. |
| **`DATABASE_PATH`** | See [SQLite on Vercel](#sqlite-on-vercel) below. |

The repo already sets `serverExternalPackages: ["better-sqlite3"]` in `next.config.ts` so the native SQLite driver bundles correctly on Vercel.

## SQLite on Vercel

ShareBoard stores data in a **SQLite file** on disk (`src/lib/db.ts` resolves `DATABASE_PATH` relative to the process working directory).

On Vercel, API routes run as **serverless functions** with an **ephemeral** filesystem:

- A path like `./data/shareboard.prod.sqlite` inside the project tree is **not durable** across deploys, instances, or regions.
- Data can appear to work briefly, then **reset or diverge** between requests.

**Practical options:**

1. **Demo / try-out only** — Set `DATABASE_PATH` to a path under `/tmp`, for example `/tmp/shareboard.sqlite`. The app creates the schema on first request. Expect **data loss**; do not rely on this for production.
2. **Real production** — Run ShareBoard on a VM or PaaS with persistent storage, or migrate the app to a hosted database (PostgreSQL, Turso, etc.) before treating Vercel as the primary backend.

## Environment variables

In the Vercel project: **Settings → Environment Variables**. Add these for **Production** (and **Preview** if you want previews to work):

| Name | Example | Description |
|------|---------|-------------|
| `AUTH_SECRET` | *(random 32+ byte string)* | Signs session cookies. Must be ≥ 16 characters. |
| `DATABASE_PATH` | `/tmp/shareboard.sqlite` | SQLite file path on the function filesystem. Use `/tmp/...` on Vercel for demos only. |

Do **not** commit production secrets. Vercel injects env vars at build and runtime; local `.env` is gitignored.

`NODE_ENV` is set automatically by Vercel (`production` on Production deployments).

## Deploy from the Vercel dashboard

1. Sign in at [vercel.com](https://vercel.com/) and click **Add New… → Project**.
2. Import your **ShareBoard** Git repository.
3. **Framework Preset:** Next.js (auto-detected).
4. **Build Command:** `npm run build` (default).
5. **Output Directory:** leave default (Next.js handles this).
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

No custom `vercel.json` is required for a standard Next.js 15 App Router deployment.

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

### Build fails on `better-sqlite3`

- Ensure **Node 20** is selected in Vercel.
- Confirm `next.config.ts` includes `serverExternalPackages: ["better-sqlite3"]`.
- Check the build log for native compile errors; retry after clearing the build cache (**Deployments → … → Redeploy** with cache cleared).

### `AUTH_SECRET must be set`

Add `AUTH_SECRET` in Vercel environment variables for the target environment (Production / Preview), redeploy, and ensure the value is at least 16 characters.

### Sign-in works locally but not on Vercel

- `AUTH_SECRET` must be set on Vercel and must stay **stable** across deploys (changing it invalidates existing sessions).
- Use the same deployment URL you registered on (cookie scope).

### Data disappears after redeploy or between users

Expected when using ephemeral storage or `/tmp`. Move to a persistent server or external database for lasting data.

## Related docs

- [README](../README.md) — local development, API reference, production on a long-running server
- [.env.example](../.env.example) — variable names and comments
