# ShareBoard

A small web app for sharing short posts with friends — links, updates, and notes on one simple board.

**Stack:** [Next.js](https://nextjs.org/) (React UI + API routes) and [SQLite](https://www.sqlite.org/) (local file database).

## Features

- **Sign up / log in** with a **User ID** and **password** (no email required).
- **Post** text to a shared board (up to 2,000 characters).
- **Delete** your own posts.
- Separate **development** and **production** configuration and database files.

## Quick start (development)

Requirements: **Node.js 20+** and **npm**.

```bash
# 1. Install dependencies
npm install

# 2. Environment (already included for local dev)
#    Edit .env.development if you want a different DB path or secret.

# 3. Create the SQLite database (optional — also created on first request)
npm run db:init

# 4. Run the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), register a User ID, then use the studio UI: **Board**, **Share with**, or **Settings** in the sidebar.

## Production

1. Copy `.env.example` values into `.env.production` on your server.
2. Set a strong **`AUTH_SECRET`** (for example: `openssl rand -base64 32`).
3. Set **`DATABASE_PATH`** (default: `./data/shareboard.prod.sqlite`).
4. Build and start:

```bash
npm install
npm run build
npm run start
```

The app listens on port **3000** by default (`PORT=8080 npm start` to change).

> **Note:** SQLite stores data in a single file. Back up the file at `DATABASE_PATH` regularly. For many concurrent writers, consider migrating to PostgreSQL later.

## User ID rules

- 3–32 characters: letters, numbers, underscore (`a–z`, `A–Z`, `0–9`, `_`).
- Password: at least **6** characters.

User IDs are compared case-insensitively for login ( `Alice` and `alice` are the same account ).

## Project layout

| Path | Purpose |
|------|---------|
| `src/app/` | Pages and API routes |
| `src/lib/db.ts` | SQLite connection and schema |
| `src/lib/auth.ts` | Password hashing and session cookies |
| `src/lib/posts.ts` | Board posts |
| `data/*.sqlite` | Database files (gitignored) |
| `.env.example` | Template for env vars |
| `.env.development` | Local dev settings (committed) |
| `.env.production` | Production settings (set on server) |
| `scripts/init-db.mjs` | Standalone DB init (`npm run db:init`) |

## API (for reference)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | No | `{ userId, password }` |
| POST | `/api/auth/login` | No | `{ userId, password }` |
| POST | `/api/auth/logout` | Cookie | Clears session |
| GET | `/api/auth/me` | Cookie | Current user |
| GET | `/api/boards` | Yes | Paginated search (`page`, `pageSize`, `keyword`, `keywordField`, `dateFrom`, `dateTo`, `likeFilter`) |
| POST | `/api/boards` | Yes | Create `{ title, url?, content, other? }` |
| PATCH | `/api/boards/:id` | Yes | Update own post |
| DELETE | `/api/boards/:id` | Yes | Soft-delete own post (`is_deleted`) |
| POST | `/api/boards/:id/like` | Yes | Toggle like for current user |
| GET | `/api/share-with/users` | Yes | Paginated users (`page`, `pageSize`, `keyword` on User ID) + share flags |
| PUT | `/api/share-with/users/:userId` | Yes | `{ shared: true/false }` (auto-save on toggle) |

Sessions use an HTTP-only cookie signed with `AUTH_SECRET`.

## Share with friends

1. Deploy the app (VPS, Railway, Fly.io, etc.) or run it on your home network.
2. Send them the URL, plus a note to **register** their own User ID.
3. Everyone sees the same board after logging in.

Keep `AUTH_SECRET` and production database backups private.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Run production server |
| `npm run lint` | ESLint |
| `npm run db:init` | Initialize SQLite schema |

## License

Private / friends project — use and modify as you like within your group.
