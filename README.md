# My Brother's Truck 🚚

**Peer-to-peer moving marketplace.** Someone nearby has a truck. Your stuff gets moved. Think Uber, but for that couch you just bought off Facebook Marketplace.

Built as a production-ready MVP with Next.js 14 (App Router), PostgreSQL, NextAuth, Stripe, and Google Maps.

---

## Table of contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Local setup](#local-setup)
- [Environment variables](#environment-variables)
- [Database schema](#database-schema)
- [API reference](#api-reference)
- [Deployment](#deployment)
  - [Vercel + Neon (recommended)](#vercel--neon-recommended)
  - [Railway](#railway)
- [Testing the flow end-to-end](#testing-the-flow-end-to-end)
- [Roadmap](#roadmap)

---

## Features

- 🔐 **Auth** — JWT sessions via NextAuth credentials provider, bcrypt-hashed passwords
- 👥 **Dual roles** — customers post jobs, helpers accept them; users can flip between roles
- 📮 **Job posting** — pickup/dropoff addresses with Google Places autocomplete, item description, size, photo upload, preferred time, optional budget
- 🗺️ **Maps** — route visualization between pickup & dropoff with Google Maps
- 🧮 **Pricing engine** — server-side distance calculation (Haversine) + size multipliers
- 🤝 **Matching** — nearby active helpers get push notifications when a job posts near them
- 🔄 **Job lifecycle** — `OPEN → ACCEPTED → IN_PROGRESS → COMPLETED` with atomic race-safe accept
- 💬 **Real-time chat** — poll-based messaging (4-second refresh) with optimistic UI
- ⭐ **Two-way reviews** — 1–5 stars + comment, aggregate ratings recomputed transactionally
- 🔔 **Notifications** — in-app bell with unread count, polled every 15 seconds
- 💳 **Payments** — Stripe Checkout in test mode for completed jobs
- 🚦 **Availability toggle** — helpers go online/offline
- 🛡️ **Admin panel** — user role management, job oversight, review moderation (hide/delete)
- ⚡ **Rate limiting** — sliding-window in-memory limiter on auth, job posting, messaging, uploads
- 🎨 **Distinctive design** — editorial newsprint aesthetic (Fraunces + Geist, warm paper palette, grain texture)

---

## Tech stack

| Layer | Choice | Why |
|-------|--------|-----|
| Framework | **Next.js 14 App Router** | Single codebase for frontend + backend, server components for fast first-paint, built-in API routes |
| Language | **TypeScript** | Type-safety across the full stack via Prisma client + Zod schemas |
| Database | **PostgreSQL** + **Prisma** | Relational fit for the domain, Prisma gives us migrations & a typed client |
| Auth | **NextAuth.js** (credentials + JWT) | Battle-tested; JWT means no DB round-trip on every request |
| Styling | **Tailwind CSS** | Rapid iteration, CSS vars for theming |
| Maps | **Google Maps JS API** (`@react-google-maps/api`) | Places Autocomplete + map rendering |
| Payments | **Stripe** (test mode) | Industry standard; the MVP uses Checkout Sessions |
| Validation | **Zod** | Same schemas server + client |
| Icons | **Lucide React** | Crisp, consistent, tree-shakeable |
| Notifications | **react-hot-toast** | Lightweight toast UX |

---

## Project structure

```
my-brothers-truck/
├─ prisma/
│  ├─ schema.prisma        # DB schema: User, Vehicle, Job, Message, Review, Notification, NextAuth tables
│  └─ seed.ts              # Demo data: 5 users, 2 trucks, 3 jobs in different states, messages, reviews
├─ public/
│  └─ uploads/             # Local image uploads land here (swap for S3/Cloudinary in prod)
├─ src/
│  ├─ app/
│  │  ├─ (auth)/           # Public auth pages
│  │  │  ├─ login/page.tsx
│  │  │  └─ register/page.tsx
│  │  ├─ (app)/            # Authenticated shell (Navbar wraps all)
│  │  │  ├─ layout.tsx
│  │  │  ├─ dashboard/page.tsx
│  │  │  ├─ jobs/
│  │  │  │  ├─ new/page.tsx
│  │  │  │  └─ [id]/page.tsx
│  │  │  ├─ available-jobs/page.tsx
│  │  │  ├─ profile/
│  │  │  │  ├─ page.tsx
│  │  │  │  └─ [id]/page.tsx
│  │  │  └─ admin/page.tsx
│  │  ├─ api/              # All server endpoints
│  │  │  ├─ auth/[...nextauth]/route.ts
│  │  │  ├─ auth/register/route.ts
│  │  │  ├─ jobs/route.ts
│  │  │  ├─ jobs/[id]/route.ts
│  │  │  ├─ jobs/[id]/accept/route.ts
│  │  │  ├─ jobs/[id]/status/route.ts
│  │  │  ├─ jobs/[id]/messages/route.ts
│  │  │  ├─ jobs/[id]/reviews/route.ts
│  │  │  ├─ users/me/route.ts
│  │  │  ├─ users/[id]/route.ts
│  │  │  ├─ availability/route.ts
│  │  │  ├─ notifications/route.ts
│  │  │  ├─ upload/route.ts
│  │  │  ├─ admin/users/route.ts
│  │  │  ├─ admin/jobs/route.ts
│  │  │  ├─ admin/reviews/[id]/route.ts
│  │  │  └─ stripe/checkout/route.ts
│  │  ├─ layout.tsx        # Root layout w/ fonts + Providers
│  │  ├─ page.tsx          # Landing page
│  │  ├─ globals.css       # Design tokens + Tailwind
│  │  ├─ not-found.tsx
│  │  └─ error.tsx
│  ├─ components/
│  │  ├─ ui/               # Primitives: Button, Input, Card, StarRating
│  │  ├─ layout/           # Navbar
│  │  ├─ jobs/             # JobCard, JobActions, ChatWindow, ReviewSection, StatusTimeline
│  │  ├─ map/              # JobMap, AddressAutocomplete
│  │  ├─ AdminTabs.tsx
│  │  ├─ AvailabilityToggle.tsx
│  │  ├─ NotificationBell.tsx
│  │  ├─ ProfileForm.tsx
│  │  └─ Providers.tsx
│  ├─ lib/
│  │  ├─ auth.ts           # NextAuth config
│  │  ├─ prisma.ts         # Prisma client singleton
│  │  ├─ utils.ts          # Haversine, pricing engine, formatters
│  │  ├─ validations.ts    # Zod schemas (shared client/server)
│  │  ├─ rate-limit.ts     # Sliding-window limiter
│  │  └─ notifications.ts  # Create + fan-out notifications
│  ├─ types/
│  │  └─ next-auth.d.ts    # Module augmentation for custom role field
│  └─ middleware.ts        # Edge-level route protection
├─ .env.example
├─ next.config.js
├─ tailwind.config.js
├─ postcss.config.js
├─ tsconfig.json
└─ package.json
```

---

## Local setup

### 1. Prerequisites

- **Node.js 18.17+** (20 LTS recommended)
- **PostgreSQL 14+** running locally, or a hosted instance (Neon / Supabase / Railway)
- `npm`, `pnpm`, or `yarn`

### 2. Clone & install

```bash
cd my-brothers-truck
npm install
```

### 3. Set up the database

**Option A — Local Postgres via Docker (fastest):**

```bash
docker run -d --name mbt-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=mbt \
  -p 5432:5432 \
  postgres:16
```

**Option B — Use an existing Postgres instance.** Just grab the connection string.

### 4. Configure environment

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in at minimum:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/mbt?schema=public"
NEXTAUTH_SECRET="paste-a-random-secret-here"    # openssl rand -base64 32
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
ADMIN_EMAIL="admin@mbt.com"                     # auto-promotes to admin on signup
```

Optional for full functionality (the app gracefully degrades without them):

```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="..."           # for real address autocomplete & maps
STRIPE_SECRET_KEY="sk_test_..."                 # for the payment flow
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
```

See [environment variables](#environment-variables) for how to obtain each.

### 5. Run migrations & seed

```bash
npx prisma migrate dev --name init
npm run prisma:seed
```

The seed creates five demo accounts (all with password `password123`):

| Email | Role |
|-------|------|
| `admin@mbt.com` | Admin |
| `maria@example.com` | Customer |
| `james@example.com` | Customer |
| `diego@example.com` | Helper (online, F-150) |
| `sarah@example.com` | Helper (online, Silverado) |

### 6. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Sign in as any demo user, or create a new account.

---

## Environment variables

| Variable | Required? | How to get it |
|----------|-----------|----------------|
| `DATABASE_URL` | ✅ | Connection string from your Postgres host (local Docker, Neon, Supabase, Railway) |
| `NEXTAUTH_SECRET` | ✅ | Run `openssl rand -base64 32` |
| `NEXTAUTH_URL` | ✅ | `http://localhost:3000` for dev; your production URL for prod |
| `NEXT_PUBLIC_APP_URL` | ✅ | Same as `NEXTAUTH_URL` |
| `ADMIN_EMAIL` | ⚙️ | Email that gets auto-promoted to `ADMIN` on first signup |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | ⚙️ | [Google Cloud Console](https://console.cloud.google.com/) → enable **Maps JavaScript API** and **Places API**; create API key; restrict to HTTP referrers of your domain |
| `STRIPE_SECRET_KEY` | ⚙️ | [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys) → Developers → API keys → **secret key** (test mode) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | ⚙️ | Same page; **publishable key** |
| `STRIPE_WEBHOOK_SECRET` | ⚙️ | Only if you wire up webhook verification later |

**Without Google Maps:** address inputs fall back to plain text with pseudo-coordinates for distance calc; the map placeholder displays a message.

**Without Stripe:** the "Pay Now" button on completed jobs returns a 503 from the API; everything else works.

---

## Database schema

```
┌─────────┐         ┌────────────┐         ┌─────────────┐
│  User   │◄────────│    Job     │────────►│   Review    │
│         │  1  *   │            │ 1   *   │             │
│ role    │         │ status     │         │ rating 1-5  │
│ avgRtg  │         │ size       │         │ hidden      │
│ active  │         │ price      │         └─────────────┘
│ baseLat │         │ distance   │
│ baseLng │         └────────────┘
└─────────┘              │  │
     │  1                │  │
     │                   │  │  1   *   ┌─────────────┐
     │  *                │  └──────────│   Message   │
┌─────────────┐          │             │  body       │
│  Vehicle    │          │             │  readAt     │
│  capacity   │          │             └─────────────┘
└─────────────┘          │
                         │  1   *   ┌─────────────────┐
                         └──────────│  Notification   │
                                    │  type, title    │
                                    └─────────────────┘
```

Key design decisions:

- **Prices in cents (Int)** — never floats, avoids subtle rounding bugs
- **Denormalized `avgRating` on User** — recomputed transactionally inside each review write, keeps profile reads cheap
- **Composite index `(pickupLat, pickupLng)`** — supports bounding-box proximity queries without PostGIS
- **`@unique([jobId, reviewerId])`** — database-enforced "one review per job per user"
- **Soft state on Job** — status enum + nullable timestamp columns (`acceptedAt`, `startedAt`, etc.) so the timeline reconstructs from the row

---

## API reference

All routes live under `/api`. Auth is required unless noted. JSON bodies + responses.

### Auth

| Method | Route | Body | Notes |
|--------|-------|------|-------|
| `POST` | `/api/auth/register` | `{email, password, name, phone?, role}` | Rate-limited 5/10min per IP |
| Handled by NextAuth | `/api/auth/[...nextauth]` | — | Sign-in, sign-out, session |

**Example — register:**

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"new@user.com","password":"password123","name":"New User","role":"CUSTOMER"}'
```

### Jobs

| Method | Route | Purpose |
|--------|-------|---------|
| `GET`    | `/api/jobs?scope=mine\|available&status=OPEN` | List jobs (role-aware) |
| `POST`   | `/api/jobs` | Create a job (customer) |
| `GET`    | `/api/jobs/[id]` | Job detail |
| `DELETE` | `/api/jobs/[id]` | Cancel a job (customer) |
| `POST`   | `/api/jobs/[id]/accept` | Helper accepts; atomic race-safe |
| `POST`   | `/api/jobs/[id]/status` | Transition: `{action: "START"\|"COMPLETE"\|"CANCEL"}` |
| `GET`    | `/api/jobs/[id]/messages?since=ISO` | List messages (incremental) |
| `POST`   | `/api/jobs/[id]/messages` | Send message |
| `GET`    | `/api/jobs/[id]/reviews` | Reviews for this job |
| `POST`   | `/api/jobs/[id]/reviews` | Leave a review (completed jobs only) |

**Example — post a job:**

```bash
curl -X POST http://localhost:3000/api/jobs \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=..." \
  -d '{
    "title":"Move new TV",
    "description":"65-inch, still in the box",
    "size":"MEDIUM",
    "pickupAddress":"Best Buy, San Antonio",
    "pickupLat":29.45, "pickupLng":-98.52,
    "dropoffAddress":"200 E Houston St",
    "dropoffLat":29.42, "dropoffLng":-98.49,
    "preferredTime":"2025-11-01T18:00:00Z"
  }'
```

### Users

| Method | Route | Purpose |
|--------|-------|---------|
| `GET`   | `/api/users/me` | Full private profile |
| `PATCH` | `/api/users/me` | Update own profile (including role) |
| `GET`   | `/api/users/[id]` | Public profile |

### Misc

| Method | Route | Purpose |
|--------|-------|---------|
| `POST` | `/api/availability` | `{isHelperActive: boolean}` |
| `GET`  | `/api/notifications` | Unread + recent |
| `POST` | `/api/notifications` | `{ids?: string[]}` mark read |
| `POST` | `/api/upload` | Multipart form with `file` field; returns `{url}` |
| `POST` | `/api/stripe/checkout` | `{jobId}` → `{url}` (redirect to Stripe) |

### Admin (role === ADMIN)

| Method | Route |
|--------|-------|
| `GET`   | `/api/admin/users` |
| `PATCH` | `/api/admin/users` |
| `GET`   | `/api/admin/jobs` |
| `PATCH` | `/api/admin/reviews/[id]` (hide/unhide) |
| `DELETE`| `/api/admin/reviews/[id]` |

---

## Deployment

### Vercel + Neon (recommended)

Fastest path — zero-config deployment, free Postgres from Neon.

**1. Provision the database (Neon)**

- Sign up at [neon.tech](https://neon.tech)
- Create a new project → copy the **pooled connection string**
- This is your `DATABASE_URL`

**2. Push the code to GitHub**

```bash
git init
git add .
git commit -m "initial"
git remote add origin git@github.com:YOUR_USER/my-brothers-truck.git
git push -u origin main
```

**3. Deploy on Vercel**

- Import the repo at [vercel.com/new](https://vercel.com/new)
- Framework preset: **Next.js** (auto-detected)
- Add these environment variables in **Project Settings → Environment Variables**:
  ```
  DATABASE_URL=<from Neon>
  NEXTAUTH_SECRET=<openssl rand -base64 32>
  NEXTAUTH_URL=https://YOUR-DOMAIN.vercel.app
  NEXT_PUBLIC_APP_URL=https://YOUR-DOMAIN.vercel.app
  ADMIN_EMAIL=your@email.com
  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=<optional>
  STRIPE_SECRET_KEY=<optional>
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=<optional>
  ```
- Click **Deploy**.

**4. Run migrations on the production DB**

Locally, pointing at the production `DATABASE_URL`:

```bash
DATABASE_URL="<prod-string>" npx prisma migrate deploy
# optional: seed demo data
DATABASE_URL="<prod-string>" npm run prisma:seed
```

**5. Swap the local upload dir for cloud storage (recommended)**

`/api/upload/route.ts` writes to `public/uploads` which is **ephemeral on Vercel**. For production, replace with Cloudinary / UploadThing / S3. The endpoint contract is `{url: string}` — the rest of the app doesn't care where bytes live.

### Railway

One-click deploy for both app + DB.

1. Create a new Railway project
2. **+ New → Database → Postgres** — Railway injects `DATABASE_URL` automatically
3. **+ New → GitHub Repo** → select your fork
4. Add the remaining env vars listed above
5. In **Settings → Deploy**, set the build command to `npm run build` and start command to `npm run start`
6. On first deploy, open the Railway shell and run:
   ```bash
   npx prisma migrate deploy
   npm run prisma:seed
   ```

---

## Testing the flow end-to-end

1. **Sign up** as a customer (`yourname@test.com`) — you land on the dashboard
2. **Post a job** — pick any addresses; with no Maps key the distance is deterministic-fake
3. Sign out, **sign in as `diego@example.com`** (password `password123`)
4. Hit **Find Jobs** — you'll see your just-posted job; click it and **Accept**
5. Back on the job page, click **Start Job** → then **Mark Complete**
6. Sign in as your customer again — click **Pay Now** (if Stripe configured) and use test card `4242 4242 4242 4242` with any future expiry + CVC
7. **Leave a review** on both sides — ratings aggregate live on the profile pages
8. Sign in as `admin@mbt.com` → visit **/admin** to see users, jobs, and moderate any review

---

## Roadmap

**Shipped in this MVP** ✅ Auth, role management, job lifecycle, map + autocomplete, in-app chat, reviews, notifications, admin panel, Stripe checkout, availability toggle, image upload, distance-based pricing.

**Ideas for v2**

- Real-time via WebSockets (Pusher / Ably / `socket.io`) instead of polling
- Live GPS tracking of helper during `IN_PROGRESS`
- Push notifications (FCM / APNs / Web Push)
- Vehicle management UI (add/edit trucks — right now the seed creates them)
- Background checks / ID verification integration
- Stripe Connect for direct payouts to helpers
- Driving-distance pricing via Google Directions API (currently Haversine straight-line)
- Search & filtering on the available-jobs board
- Mobile app (React Native) sharing the same API

---

## License

MIT — do whatever you want with this. If you ship it as a real product, a mention in the footer would be kind.
