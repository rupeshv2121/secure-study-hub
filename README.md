# Secure Study Hub

A secure, purchase-gated lecture delivery platform. Educators upload lecture slides (PDF or images); students buy access to a subject with a UPI payment plus a screenshot as proof, an admin approves it, and the content is then rendered in a hardened viewer that blocks copying, printing, screenshots and offline retention.

**This repository is the web client**, and it also serves as the project's architecture reference. The platform is three separate repositories sharing one Express + PostgreSQL API:

| Component | Repository | Stack | Deployed to |
| --- | --- | --- | --- |
| **Web client** (this repo) | [`secure-study-hub`](https://github.com/rupeshv2121/secure-study-hub) | React 18, Vite 5, TypeScript, Tailwind, shadcn/ui, TanStack Query | Vercel |
| **Backend API** | [`secure-study-hub-backend`](https://github.com/rupeshv2121/secure-study-hub-backend) | Express 5, TypeScript, Prisma 6, PostgreSQL, Zod | Render (primary) / Vercel |
| **Mobile client** | [`secure-study-hub-mobile`](https://github.com/rupeshv2121/secure-study-hub-mobile) | Expo SDK 57, Expo Router, React Native 0.86, NativeWind 4 | EAS Build (Android, iOS) |

File storage runs on **Supabase Storage** (private buckets + short-lived signed URLs) with optional **Google Drive** streaming for large PDFs. Transactional email goes through **Resend**.

---

## Table of contents

**This app**
- [Quick start](#quick-start)
- [Web app structure](#web-app-structure)
- [Environment variables](#environment-variables)
- [Build and deploy](#build-and-deploy)

**Platform reference**
- [System architecture](#system-architecture)
- [Feature matrix](#feature-matrix)
- [Data model](#data-model)
- [Pipelines](#pipelines)
- [Security model](#security-model)
- [API reference](#api-reference)
- [Known gaps](#known-gaps)

---

## Quick start

Requires Node 18+ and a running backend (see the [backend repo](https://github.com/rupeshv2121/secure-study-hub-backend) — default `http://localhost:4000`).

```bash
npm install
cp .env.example .env      # set VITE_API_URL=http://localhost:4000
npm run dev               # http://localhost:5173
```

| Script | Does |
| --- | --- |
| `npm run dev` | Vite dev server with HMR |
| `npm run build` | Production bundle to `dist/` |
| `npm run build:dev` | Development-mode bundle (source maps, no minification) |
| `npm run preview` | Serve the built `dist/` locally |
| `npm run lint` | ESLint across the project |

---

## Web app structure

```
src/
├─ api/
│  ├─ client.ts            # apiFetch: URL building + Bearer token injection
│  └─ auth.ts              # login / register / profile calls
├─ components/
│  ├─ admin/               # AdminStats, AdminCategories, AdminSubjects,
│  │                       # AdminLectures, AdminPurchases, AdminFeedback
│  ├─ ui/                  # 49 shadcn/ui primitives
│  ├─ SecureViewer.tsx     # hardened canvas slide viewer
│  ├─ SubjectCard.tsx  CategoryCard.tsx  LectureCard.tsx
│  ├─ LandingHero.tsx  FeatureGrid.tsx  Testimonials.tsx  FAQSection.tsx
│  └─ FeedbackForm.tsx  FeedbackFab.tsx  Navbar.tsx  SiteLoader.tsx
├─ contexts/AuthContext.tsx  # token storage + profile hydration on boot
├─ hooks/
│  ├─ useSecurityProtection.ts  # key blocking, blur, DevTools heuristic
│  └─ useSubjectAccess.ts       # client-side purchase gating (UX only)
├─ interfaces/             # shared TS types, grouped by consumer
├─ pages/                  # Index, Auth, Subjects, Lectures, Viewer,
│                          # MyPurchases, Profile, Admin, NotFound
├─ integrations/supabase/  # client for the public anon key
└─ utils/pdfToImages.ts    # SRI-pinned pdf.js rasteriser
```

**Routing and code splitting.** All nine routes are `React.lazy` chunks behind a `Suspense` boundary, so heavy dependencies (`recharts` on the admin dashboard, pdf.js on the viewer) only download when their page is visited. A boot loader holds until auth resolves, with a 600 ms floor so it cannot flash. See [`src/App.tsx`](src/App.tsx).

| Route | Page | Access |
| --- | --- | --- |
| `/` | Landing — hero, features, testimonials, FAQ | public |
| `/auth` | Login / register | public |
| `/subjects` | Categories and subjects, with purchase CTA | public |
| `/lectures` | Lectures within a subject | public (metadata) |
| `/viewer/:id` | Secure slide viewer | entitlement-checked |
| `/my-purchases` | Purchase history and status | authenticated |
| `/profile` | Edit name and phone | authenticated |
| `/admin` | Admin dashboard (6 panels) | admin only |

**State.** TanStack Query owns all server state; `AuthContext` is the only global store. There is no Redux.

---

## Environment variables

Every `VITE_*` value is compiled into the browser bundle and is therefore **public** — never put a secret here.

| Variable | Notes |
| --- | --- |
| `VITE_API_URL` | Backend base URL **without** `/api` — [`client.ts`](src/api/client.ts) appends it |
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Public anon key only. The service role key belongs on the backend and nowhere else |
| `VITE_PAYMENT_UPI_ID` | UPI ID shown on the payment screen |

Mode-specific files are already wired: `.env.development` and `.env.production` override `.env`.

---

## Build and deploy

Deploy as its own Vercel project with the root directory set to this repository.

| Setting | Value |
| --- | --- |
| Build command | `npm run build` |
| Output directory | `dist` |

[`vercel.json`](vercel.json) supplies three things: an SPA rewrite so React Router routes survive a hard refresh, security headers (HSTS, `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, strict referrer policy, and a Permissions-Policy denying camera/microphone/geolocation), and a one-year immutable cache on `/assets/*`.

> `VITE_API_URL` is **baked in at build time**. Changing it in the Vercel dashboard has no effect until you redeploy — editing repo files alone will not change the production bundle.

---

## System architecture

```mermaid
flowchart TB
    subgraph Clients
        WEB["Web app (this repo)<br/>React 18 + Vite<br/>SecureViewer (canvas)"]
        MOB["Mobile app<br/>Expo 57 + Expo Router<br/>SecureDocViewer (WebView)"]
    end

    subgraph API["Backend API - Express 5 + TypeScript"]
        MW["helmet - CORS allowlist - morgan - express.json"]
        AUTH["authMiddleware (JWT)<br/>adminOnly (RBAC)"]
        MODS["Feature modules<br/>auth - subjects - categories - lectures<br/>lectureSlides - purchases - viewLogs<br/>feedback - storage - external"]
        ERR["asyncHandler to errorMiddleware to notFound"]
    end

    subgraph Data
        PG[("PostgreSQL<br/>via Prisma 6")]
        SB[("Supabase Storage<br/>private buckets")]
        GD[("Google Drive<br/>service account")]
    end

    RS["Resend<br/>transactional email"]

    WEB -->|"HTTPS + Bearer JWT"| MW
    MOB -->|"HTTPS + Bearer JWT"| MW
    MW --> AUTH --> MODS --> ERR
    MODS --> PG
    MODS -->|"upload / signed URL"| SB
    MODS -->|"stream / import"| GD
    MODS -->|"purchase alerts"| RS
    SB -.->|"signed URL, 300s TTL"| WEB
    SB -.->|"signed URL, 300s TTL"| MOB
```

**Design principles baked into the code**

1. **Single source of truth for authorization.** Slide bytes are never addressable without first passing `GET /api/lecture-slides`, which re-checks purchase state server-side. Client-side gating (`useSubjectAccess`) is UX only.
2. **Fail-closed access checks.** Access is gated on the **subject** price, never the lecture price (lectures default to `0`); an unknown subject price denies access.
3. **Boot-never-crash config.** The backend validates env with Zod but does *not* `process.exit` on failure. It degrades to a best-effort env and reports the offending key names through `GET /api/health`, so a blank serverless env var cannot turn every route into an opaque `FUNCTION_INVOCATION_FAILED`.
4. **Modular vertical slices.** Every backend feature is `*.routes.ts` -> `*.controller.ts` -> `*.service.ts` -> `*.schema.ts` (Zod).
5. **Stateless auth.** No server sessions; a signed JWT (`sub`, `email`, `role`) is the entire auth context — `localStorage` on web, OS keychain on mobile.

### Request lifecycle

```mermaid
sequenceDiagram
    participant C as Client
    participant H as helmet + CORS
    participant R as /api router
    participant A as authMiddleware
    participant Z as Zod schema
    participant S as service
    participant P as Prisma / Postgres
    participant E as errorMiddleware

    C->>H: HTTPS request (Bearer token)
    H->>H: Origin in CORS_ORIGIN allowlist?
    H->>R: route match
    R->>A: protected route
    A->>A: jwt.verify -> req.user {id,email,role}
    A->>Z: adminOnly? (role === ADMIN)
    Z->>S: parsed, typed payload
    S->>P: query / mutation
    P-->>C: { success: true, data }
    Note over E: AppError(status,message) or thrown error<br/>becomes uniform { success:false, message }
```

---

## Feature matrix

### Students

| Feature | Web | Mobile |
| --- | :-: | :-: |
| Register / login (JWT) | yes | yes |
| Browse categories to subjects to lectures | yes | yes |
| Subject detail with price and purchase state | yes | yes |
| UPI purchase request with screenshot upload | yes | yes (expo-image-picker) |
| Purchase history with PENDING/APPROVED/REJECTED badges | yes | yes |
| Secure lecture viewer (watermark, blur-on-blur, zoom) | yes | yes |
| Landscape viewing / fullscreen | yes (Fullscreen API) | yes (expo-screen-orientation) |
| OS-level screenshot block | best-effort only | yes (expo-screen-capture) |
| Profile edit (name, phone) | yes | yes |
| Feedback / rating submission | yes | not yet |
| Free subjects (price 0) open without purchase | yes | yes |

### Administrators (web only, `/admin`)

| Panel | Capability |
| --- | --- |
| [AdminStats](src/components/admin/AdminStats.tsx) | Totals for users, lectures, categories and views, plus the 10 most recent views |
| [AdminCategories](src/components/admin/AdminCategories.tsx) | Category CRUD (name, description, icon, colour) |
| [AdminSubjects](src/components/admin/AdminSubjects.tsx) | Subject CRUD (price, slug, active flag, category link) |
| [AdminLectures](src/components/admin/AdminLectures.tsx) | Lecture CRUD, drag-and-drop reordering (`@dnd-kit`), publish toggle, slide upload |
| [AdminPurchases](src/components/admin/AdminPurchases.tsx) | Purchase queue: inspect the payment screenshot, approve or reject with a note |
| [AdminFeedback](src/components/admin/AdminFeedback.tsx) | Approve feedback for public display as testimonials |

---

## Data model

```mermaid
erDiagram
    User ||--o{ Purchase : "makes"
    User ||--o{ Feedback : "writes"
    Category ||--o{ Subject : "groups"
    Subject ||--o{ Lecture : "contains"
    Subject ||--o{ Purchase : "is bought as"
    Subject ||--o{ Feedback : "is rated in"
    Lecture ||--o{ LectureSlide : "renders as"
    Lecture ||--o{ ViewLog : "is opened in"
    Lecture ||--o{ Purchase : "legacy per-lecture buy"

    User {
        string id PK
        string supabaseId UK "nullable"
        string email UK
        string name
        string phoneNumber
        string passwordHash "bcrypt, 10 rounds"
        enum   role "STUDENT or ADMIN"
    }
    Subject {
        string  id PK
        string  slug UK
        float   price "0 = free"
        boolean isActive
        string  categoryId FK
    }
    Lecture {
        string  id PK
        string  subjectId FK
        string  contentUrl
        boolean published
        int     order "drag-and-drop rank"
        int     viewCount
    }
    LectureSlide {
        string id PK
        string lectureId FK
        int    slideNumber
        string storagePath "bucket path, drive id, or data URI"
    }
    Purchase {
        string id PK
        string userId FK
        string subjectId FK "nullable"
        float  amount
        string currency "INR"
        enum   status "PENDING APPROVED REJECTED COMPLETED REFUNDED"
        string screenshotPath "base64 data URI"
        string adminNote
        string reviewedById FK
        json   metadata
    }
    Feedback {
        string  id PK
        int     rating
        string  message
        boolean isPublic
        boolean approved "admin-gated"
    }
```

`Purchase` also carries a self-referencing reviewer link (`reviewedById` to `User`) recording which admin actioned the request.

Canonical schema: [prisma/schema.prisma](https://github.com/rupeshv2121/secure-study-hub-backend/blob/main/prisma/schema.prisma) (14 migrations applied).

**`storagePath` is polymorphic** and the viewers branch on its shape:

| Shape | Resolution |
| --- | --- |
| `lectures/<id>/slide-3.png` | Supabase bucket path, resolved via `GET /api/storage/lecture-slides/signed-url` (300s TTL) |
| `drive:<fileId>` | Streamed through `GET /api/external/drive/:id/stream` with the caller's JWT |
| `https://...` or `data:...` | Used verbatim |

---

## Pipelines

### 1. Authentication

```mermaid
flowchart LR
    R["POST /auth/register<br/>name, email, password, phone"] --> BC["bcrypt.hash(10)"]
    BC --> U[("User row<br/>role = STUDENT")]
    L["POST /auth/login"] --> CMP["bcrypt.compare"]
    CMP -->|match| JWT["jwt.sign sub,email,role<br/>JWT_EXPIRES_IN default 7d"]
    U --> JWT
    JWT --> ST{"client store"}
    ST -->|web| LS["localStorage: auth_token"]
    ST -->|mobile| SS["expo-secure-store<br/>OS keychain / keystore"]
    LS --> ME["GET /me - hydrate profile on boot"]
    SS --> ME
    ME -->|401| CLR["clear token, treat as logged out"]
    SUP["POST /auth/sync and /auth/webhook"] -.->|"legacy Supabase Auth bridge"| U
```

Both clients hydrate identically: read the stored token, call `GET /me`, and on any failure discard the token and fall back to logged out. Role comes from the JWT claim and is re-verified server-side by `adminOnly` on every privileged call — the client's `user.role` only decides what UI to draw.

### 2. Content ingestion (admin-authored)

```mermaid
flowchart TB
    A["Admin picks a PDF in the browser"] --> B["pdf.js loaded from cdnjs<br/>with SRI hashes pinned"]
    B --> C["getPdfPageCount, capped at MAX_PDF_PAGES = 200"]
    C --> D["Render each page to canvas, export PNG Blob"]
    D --> E["POST /storage/lecture-slides/upload<br/>multipart, admin only"]
    E --> F["multer to /tmp, read into Buffer"]
    F --> G["supabase.storage.upload with upsert<br/>auto-creates a private bucket on miss"]
    G --> H["temp file unlinked in finally block"]
    G --> I["POST /lecture-slides<br/>lectureId, slideNumber, storagePath"]
    I --> J[("LectureSlide rows")]

    K["Alternative path: Google Drive"] --> L["POST /external/drive/upload (admin)"]
    L --> M["Drive service account"]
    M --> N["storagePath = drive:fileId"]
    N --> J
```

PDF rasterisation happens **in this app, client-side** ([`src/utils/pdfToImages.ts`](src/utils/pdfToImages.ts)), so the server never needs a PDF toolchain — which is what keeps the API deployable to a serverless runtime. The trade-off is browser memory, hence the 200-page cap.

### 3. Purchase and approval

```mermaid
sequenceDiagram
    actor S as Student
    participant C as Client
    participant API as Backend
    participant DB as Postgres
    participant M as Resend
    actor A as Admin

    S->>C: Open a paid subject
    C->>S: Show UPI ID + QR (VITE_PAYMENT_UPI_ID)
    S->>S: Pay in any UPI app, screenshot the receipt
    S->>C: Attach screenshot (max 8 MB)
    C->>API: POST /purchases (multipart: screenshot, amount, subjectId)
    API->>API: multer memoryStorage -> base64 data URI
    API->>DB: Purchase { status: PENDING }
    API->>M: notifyAdminOfPurchaseRequest (never throws)
    M-->>A: "New purchase request: subject - student"
    A->>API: POST /purchases/:id/review { status, adminNote }
    API->>DB: status = APPROVED or REJECTED, reviewedAt = now()
    S->>API: GET /lecture-slides?lectureId=...
    API->>DB: hasApprovedSubjectAccess(userId, subjectId)
    DB-->>API: APPROVED or COMPLETED row exists?
    API-->>S: slides (200) or "Purchase approval required" (403)
```

**State reduction rule**: a subject's state is the maximum over its purchase rows, so approval always wins and a later rejected resubmission can never revoke access already granted. `APPROVED` and `COMPLETED` grant access; `PENDING`, `REJECTED` and `REFUNDED` do not.

### 4. Secure viewing

```mermaid
flowchart TB
    OPEN["Student opens a lecture"] --> GATE{"access check"}
    GATE -->|"admin"| OK
    GATE -->|"subject price <= 0"| OK
    GATE -->|"approved purchase"| OK
    GATE -->|"otherwise, fail closed"| DENY["Locked screen with purchase CTA"]

    OK["GET /lecture-slides - server re-checks access"] --> RES["Resolve each storagePath"]
    RES --> SIG["Supabase signed URL, 300s"]
    RES --> DRV["Authenticated Drive stream"]
    SIG --> RENDER
    DRV --> RENDER

    subgraph RENDER["Hardened render"]
        direction TB
        W["Tiled watermark: email + timestamp"]
        BL["Blur overlay on window blur / tab hide"]
        KB["Key blocking: Ctrl+S/P/C/U/A, F12,<br/>Ctrl+Shift+I/J/C, PrintScreen,<br/>Win+Shift+S, Cmd+Shift+3/4/5"]
        RC["contextmenu and text selection disabled"]
        DT["DevTools heuristic on outer/inner size delta"]
        SC["Mobile only: usePreventScreenCapture()"]
    end

    RENDER --> LOG["POST /view-logs -> ViewLog + viewCount++"]
```

[`SecureViewer.tsx`](src/components/SecureViewer.tsx) paints slides to a `<canvas>` rather than an `<img src>` a user could right-click and save, with zoom, prev/next and fullscreen. The [mobile viewer](https://github.com/rupeshv2121/secure-study-hub-mobile/blob/main/src/components/SecureDocViewer.tsx) renders a whole lecture into one continuously scrolling WebView and adds a real OS-level screenshot block — the one guarantee this web client cannot make.

---

## Security model

| Layer | Control | Where |
| --- | --- | --- |
| Transport | HSTS, `nosniff`, `SAMEORIGIN`, strict referrer, locked-down Permissions-Policy | [vercel.json](vercel.json) |
| Transport | Helmet defaults with `crossOriginResourcePolicy: cross-origin` | backend `app.ts` |
| Origin | Explicit CORS allowlist from `CORS_ORIGIN`; requests with no `Origin` (native mobile) pass | backend `app.ts` |
| Identity | bcrypt (10 rounds), JWT HS256, `JWT_SECRET` of at least 16 chars enforced by Zod | backend `auth.service.ts` |
| Token storage | `localStorage` on web, OS keychain via `expo-secure-store` on mobile | [AuthContext.tsx](src/contexts/AuthContext.tsx) |
| Authorization | `authMiddleware` + `adminOnly` on every mutating route; controllers re-assert role | backend `auth.middleware.ts` |
| Entitlement | `hasApprovedSubjectAccess` on the slide-list endpoint, subject-level and fail-closed | backend `purchase.service.ts` |
| Content at rest | Private Supabase buckets, never public | backend `storage.service.ts` |
| Content in transit | Signed URLs, 300-second TTL, minted per request | backend `storage.service.ts` |
| Path safety | `normalizeStoragePath` rejects `..`, absolute and bucket-escaping paths | backend `storage.service.ts` |
| Input | Zod schemas per module; parse failures surface as 400 | backend `*.schema.ts` |
| Uploads | 8 MB cap on purchase screenshots; temp files unlinked in `finally` | backend `purchase.routes.ts` |
| Supply chain | pdf.js pinned to 3.11.174 with SRI hashes on both script and worker | [pdfToImages.ts](src/utils/pdfToImages.ts) |
| Client hardening | Watermark, blur-on-blur, key blocking, DevTools heuristic | [useSecurityProtection.ts](src/hooks/useSecurityProtection.ts) |

> **Threat-model honesty.** The web protections (key blocking, blur, DevTools detection) raise the cost of casual copying; they are **not** a defence against a determined user with a camera, a second device, or a patched browser. The only hard controls are server-side: purchase verification before slide URLs are ever minted, private buckets, and 5-minute signed URLs. The mobile client is meaningfully stronger because `expo-screen-capture` is enforced by the OS.

---

## API reference

Base URL `<host>/api`. All responses use the envelope `{ success, data | message }`. Auth is `Authorization: Bearer <jwt>`. Implementation lives in the [backend repo](https://github.com/rupeshv2121/secure-study-hub-backend).

**Legend** — `pub` public, `auth` authenticated, `admin` admin only.

| Method | Endpoint | Auth | Purpose |
| --- | --- | :-: | --- |
| GET | `/health` | pub | Liveness; returns 500 with `envIssues` when config is invalid |
| POST | `/auth/register` | pub | Create account, returns `{ user, token }` |
| POST | `/auth/login` | pub | Exchange credentials for a JWT |
| POST | `/auth/sync` | pub | Upsert a user from Supabase Auth (legacy bridge) |
| POST | `/auth/webhook` | pub | Supabase user-created webhook target |
| GET | `/me` | auth | Current profile, read from the database |
| PUT | `/me` | auth | Update name / phone |
| GET | `/categories`, `/categories/:id` | pub | List / read categories |
| POST, PUT, DELETE | `/categories`, `/categories/:id` | admin | Category CRUD |
| GET | `/subjects`, `/subjects/:id` | pub | List / read subjects |
| POST, PUT, DELETE | `/subjects`, `/subjects/:id` | admin | Subject CRUD |
| GET | `/lectures`, `/lectures/:id` | pub | List / read lectures (metadata only) |
| POST, PUT, DELETE | `/lectures`, `/lectures/:id` | admin | Lecture CRUD, ordering, publish flag |
| GET | `/lecture-slides?lectureId=` | auth | **Entitlement-checked** slide list |
| POST | `/lecture-slides` | admin | Attach a slide to a lecture |
| DELETE | `/lecture-slides/:id` | admin | Remove a slide |
| POST | `/purchases` | auth | Submit a purchase request (multipart, field `screenshot`) |
| GET | `/purchases` | auth | Own purchases; all purchases when admin |
| GET | `/purchases/:id` | auth | Purchase detail |
| POST | `/purchases/:id/review` | admin | Approve / reject with an admin note |
| POST | `/view-logs` | auth | Record a lecture view |
| GET | `/feedbacks/public` | pub | Approved public testimonials |
| POST | `/feedbacks` | pub | Submit feedback (auth optional) |
| GET | `/feedbacks` | admin | All feedback for moderation |
| PUT | `/feedbacks/:id/approve` | admin | Publish a testimonial |
| POST | `/storage/:bucket/upload` | admin | Upload a file (multipart, field `file`) |
| POST | `/storage/:bucket/remove` | admin | Delete objects |
| GET | `/storage/:bucket/signed-url?path=` | auth | Mint a 300s signed URL |
| GET | `/storage/:bucket/exists` | auth | Debug: does an object exist |
| GET | `/external/drive/:id/stream` | auth | Proxy-stream a Drive file |
| POST | `/external/drive/:id/import` | admin | Copy a Drive file into a bucket |
| POST | `/external/drive/upload` | admin | Upload straight to Drive |
| GET | `/external/drive/:id/meta`, `/debug`, `/external/test` | pub | **development only** Drive diagnostics |
| GET | `/admin/stats` | admin | Totals plus the 10 most recent views |

---

## Known gaps

Tracked here so nobody rediscovers them the hard way:

- **No automated tests** in any of the three repositories.
- **Purchase screenshots are stored as base64 data URIs** in the `Purchase.screenshotPath` column rather than in object storage. Simple and self-contained, but it inflates row size and the payload of every purchase list query.
- **No rate limiting** on `/auth/login` or `/auth/register`.
- **`/auth/webhook` is unauthenticated** even though `SUPABASE_WEBHOOK_SECRET` exists in the backend config schema; the secret is not yet verified in the handler.
- **The Supabase-Auth bridge is a dual path.** Password auth in Postgres is the live system; `/auth/sync`, `/auth/webhook` and the backend's `supabase/migrations/` directory are leftovers from the earlier Supabase-RLS architecture.
- **Feedback is web-only**; there is no mobile surface for it yet.
