# Kliboard v2 — Project Rebuild Instructions

This document is a complete specification for rebuilding the Kliboard application from scratch with a modern, simplified tech stack. It is based on a thorough analysis of the original Kliboard project and iterative design decisions.

**Key architectural decisions:**
- Single Next.js project (no monorepo, no separate backend)
- Supabase handles database, auth, and file storage
- Polling via TanStack Query instead of WebSockets
- Everything deploys to Vercel's free tier
- Total hosting cost: **$0/month**

---

## 1. What Kliboard Is

Kliboard is a web-based temporary text clipboard. Users create named "spaces," paste text into them, and share via the space name. Spaces auto-delete after a chosen duration (5 minutes to 10 days). No login is required to use basic features. Think of it as a lightweight, ephemeral pastebin.

### Core User Flows (Existing)

1. **Create a space** — User enters a space name on the home page, writes text content, picks an expiration duration, and saves.
2. **Access a space** — User navigates to a space by name, sees the saved text, can copy it or update it.
3. **Browse recent spaces** — Home page shows the last few updated spaces.
4. **Auto-expiration** — Spaces are automatically deleted after their chosen duration.

### New Features for v2

5. **File attachments** — Users can attach files (images, documents, small binaries) to a space alongside text.
6. **Optional authentication** — Users can create accounts to manage their spaces, see history, and set private spaces. Anonymous usage still works.
7. **Near real-time sync** — Multiple users viewing the same space see updates within seconds via polling.
8. **Private/public spaces** — Authenticated users can mark spaces as private (only accessible with auth).
9. **Space passwords** — Optional password protection for individual spaces (no account required).

---

## 2. Tech Stack

Everything lives in a single Next.js project. No monorepo, no separate backend, no extra deployment.

| Concern | Tool | Version | Why |
|---|---|---|---|
| Framework | **Next.js (App Router)** | 16.x | Full-stack React framework. API routes, server components, file-based routing, Turbopack bundler — all in one. |
| Language | **TypeScript** | 5.x | Type safety across the entire stack. v1's backend was plain JS — this was a major weakness. |
| React | **React** | 19.x | Ships with Next.js 16. Server Components, `useEffectEvent`, View Transitions. |
| Server state | **TanStack Query** | 5.x | Handles caching, polling, refetching, optimistic updates, loading/error states. Replaces manual `useState` + `useEffect` fetch patterns. |
| Client state | **Zustand** | 5.x | Lightweight global state for theme and notifications. |
| Styling | **Tailwind CSS** | 4.x | Utility-first, CSS-native configuration (no JS config file), dark mode built-in, 5x faster builds. |
| Components | **shadcn/ui (Luma style)** | CLI v4 | Accessible, composable components built on Radix UI + Tailwind. Luma style gives softer, modern feel. Not a dependency — components live in your codebase. |
| Validation | **Zod** | 4.x | 14x faster than v3, 57% smaller bundle. Shared between client and server. `@zod/mini` (~1.9KB) available for client-only validation. |
| Database | **Supabase (PostgreSQL)** | JS client v2.x | Managed Postgres with typed queries, no cold starts on free tier. |
| Auth | **Supabase Auth** | (included) | Built-in email/password + OAuth. No separate auth library needed. |
| File storage | **Supabase Storage** | (included) | S3-compatible, client-side direct uploads, 1GB free. |
| Rate limiting | **Upstash Redis** + **@upstash/ratelimit** | Redis v1.x, Ratelimit v2.x | Serverless Redis, HTTP-based (no connection issues), free tier. |
| Date handling | **date-fns** | 3.x+ | Tree-shakeable, functional API, good TypeScript support. |
| Icons | **Lucide React** | latest | Clean, consistent icon set. Replaces hand-rolled SVG components. |
| Clipboard | **Navigator Clipboard API** (native) | — | `navigator.clipboard.writeText()` is supported everywhere. No library needed. |
| Deployment | **Vercel** | — | Single deployment for frontend + API routes. Free tier. |

### What we intentionally don't use

| Avoided | Why |
|---|---|
| **Vite + separate SPA** | Next.js gives us API routes, SSR, and file-based routing in one project. No need for a separate build tool. |
| **Express / Hono backend** | Next.js API routes (Route Handlers) cover all our needs. No separate server to deploy. |
| **Prisma** | Adds cold start overhead (~200-300ms) in serverless. Supabase client is lighter, already installed for auth/storage, and uses HTTP (no connection pooling headaches). |
| **Socket.IO / WebSockets** | Incompatible with serverless. TanStack Query polling every 5 seconds is indistinguishable from real-time for a clipboard app. |
| **Monorepo (Turborepo)** | With everything in one Next.js project, there's nothing to share across packages. Types and schemas are just imports. |
| **Docker Compose** | No local Postgres/Redis/MinIO to run. Supabase has a local dev CLI, Upstash is remote-only. |
| **Render / Railway** | No persistent backend server needed. Vercel serverless handles everything. |

---

## 3. Project Structure

```
kliboard-v2/
├── app/
│   ├── layout.tsx                        # Root layout (fonts, theme, providers)
│   ├── page.tsx                          # Home page (recent spaces, search)
│   ├── not-found.tsx                     # 404 page
│   ├── space/
│   │   └── [name]/
│   │       └── page.tsx                  # Space view/edit page
│   ├── login/
│   │   └── page.tsx
│   ├── register/
│   │   └── page.tsx
│   ├── dashboard/
│   │   └── page.tsx                      # Authenticated user's space list
│   └── api/
│       ├── spaces/
│       │   ├── route.ts                  # POST: create space
│       │   ├── recent/
│       │   │   └── route.ts             # GET: recent public spaces
│       │   └── [name]/
│       │       ├── route.ts             # GET, PATCH, DELETE: space CRUD
│       │       └── files/
│       │           ├── route.ts         # POST: record file metadata, GET: list files
│       │           └── [fileId]/
│       │               └── route.ts     # DELETE: remove file
│       └── cron/
│           └── cleanup/
│               └── route.ts             # Cron-triggered expired space cleanup
│
├── components/
│   ├── ui/                               # shadcn/ui components (button, input, dialog, etc.)
│   ├── space/
│   │   ├── space-editor.tsx              # Text editor + duration picker + save
│   │   ├── space-viewer.tsx              # Read-only display for space content
│   │   ├── file-upload.tsx               # Drag-and-drop upload zone
│   │   ├── file-list.tsx                 # Attached files with download/delete
│   │   ├── duration-picker.tsx           # Expiration duration selector
│   │   └── space-password-dialog.tsx     # Password prompt modal
│   ├── layout/
│   │   ├── navbar.tsx
│   │   ├── footer.tsx
│   │   └── theme-toggle.tsx
│   └── shared/
│       ├── link-detector.tsx             # Extract and render clickable URLs from text
│       └── recent-spaces-grid.tsx        # Card grid for home page
│
├── hooks/
│   ├── use-space.ts                      # TanStack Query: space CRUD + polling
│   ├── use-auth.ts                       # Supabase auth state
│   └── use-file-upload.ts               # Supabase Storage upload logic
│
├── stores/
│   ├── theme-store.ts                    # Zustand: dark/light mode
│   └── notification-store.ts             # Zustand: toast queue (if not using Sonner directly)
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts                     # Browser Supabase client
│   │   ├── server.ts                     # Server-side Supabase client (for Route Handlers)
│   │   └── middleware.ts                 # Auth session refresh in Next.js middleware
│   ├── schemas/                          # Zod validation schemas (shared by client + server)
│   │   ├── space.schema.ts
│   │   └── auth.schema.ts
│   ├── types/
│   │   └── database.types.ts            # Auto-generated from Supabase schema
│   ├── rate-limit.ts                     # Upstash rate limiter setup
│   ├── constants.ts                      # Duration options, reserved names, limits
│   └── utils.ts                          # Shared utilities
│
├── supabase/
│   ├── config.toml                       # Supabase local dev config
│   └── migrations/
│       ├── 00001_create_spaces.sql
│       ├── 00002_create_files.sql
│       └── 00003_enable_rls.sql
│
├── public/
│   ├── favicon.ico
│   └── og-image.png
│
├── middleware.ts                          # Next.js middleware (auth session refresh)
├── app/globals.css                       # Tailwind imports + @theme config
├── next.config.ts
├── tsconfig.json
├── package.json
├── .env.local.example
├── vercel.json                           # Cron job config
└── README.md
```

---

## 4. Database Schema

Managed via Supabase SQL migrations in `supabase/migrations/`.

### Spaces Table

```sql
-- supabase/migrations/00001_create_spaces.sql

create table public.spaces (
  id          uuid primary key default gen_random_uuid(),
  name        text unique not null,
  content     text not null default '',
  password_hash text,                              -- Optional space-level password (bcrypt)
  is_private  boolean not null default false,
  duration    int not null,                         -- Minutes: 5, 60, 600, 1440, 14400
  expires_at  timestamptz not null,
  owner_id    uuid references auth.users(id) on delete set null,  -- Null for anonymous spaces
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Indexes
create index idx_spaces_expires_at on public.spaces (expires_at);
create index idx_spaces_updated_at on public.spaces (updated_at desc);
create index idx_spaces_owner_id on public.spaces (owner_id);

-- Auto-update updated_at on row changes
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger spaces_updated_at
  before update on public.spaces
  for each row execute function update_updated_at();
```

### Files Table

```sql
-- supabase/migrations/00002_create_files.sql

create table public.files (
  id           uuid primary key default gen_random_uuid(),
  space_id     uuid not null references public.spaces(id) on delete cascade,
  filename     text not null,                       -- Original filename
  storage_path text not null,                       -- Supabase Storage path
  mime_type    text not null,
  size_bytes   int not null,
  created_at   timestamptz not null default now()
);

create index idx_files_space_id on public.files (space_id);
```

### Row Level Security

```sql
-- supabase/migrations/00003_enable_rls.sql

alter table public.spaces enable row level security;
alter table public.files enable row level security;

-- Spaces: anyone can read public spaces
create policy "Public spaces are viewable by everyone"
  on public.spaces for select
  using (is_private = false);

-- Spaces: owners can read their own private spaces
create policy "Owners can view their private spaces"
  on public.spaces for select
  using (auth.uid() = owner_id);

-- Spaces: anyone can insert (anonymous space creation)
create policy "Anyone can create spaces"
  on public.spaces for insert
  with check (true);

-- Spaces: anyone can update public spaces, owners can update private ones
create policy "Public spaces are updatable by everyone"
  on public.spaces for update
  using (is_private = false);

create policy "Owners can update their spaces"
  on public.spaces for update
  using (auth.uid() = owner_id);

-- Spaces: only owners can delete
create policy "Owners can delete their spaces"
  on public.spaces for delete
  using (auth.uid() = owner_id);

-- Files: follow the same access rules as the parent space
create policy "Files are viewable if space is accessible"
  on public.files for select
  using (
    exists (
      select 1 from public.spaces
      where spaces.id = files.space_id
      and (spaces.is_private = false or spaces.owner_id = auth.uid())
    )
  );

create policy "Anyone can add files to accessible spaces"
  on public.files for insert
  with check (
    exists (
      select 1 from public.spaces
      where spaces.id = files.space_id
      and (spaces.is_private = false or spaces.owner_id = auth.uid())
    )
  );
```

### Generate TypeScript Types

```bash
npx supabase gen types typescript --project-id your-project-id > lib/types/database.types.ts
```

This gives you fully typed queries without Prisma.

---

## 5. API Design

All API routes live in `app/api/` as Next.js Route Handlers.

### Spaces

| Method | Route | Auth | Description |
|---|---|---|---|
| `GET` | `/api/spaces/recent` | None | Get the 10 most recently updated public spaces |
| `GET` | `/api/spaces/[name]` | None* | Get a space by name. *Returns 401 if private and not owner. Requires `X-Space-Password` header if password-protected. |
| `POST` | `/api/spaces` | None | Create a new space |
| `PATCH` | `/api/spaces/[name]` | None* | Update content/duration. *Owner-only if private. |
| `DELETE` | `/api/spaces/[name]` | Owner | Delete a space (authenticated owners only) |

### Files

| Method | Route | Auth | Description |
|---|---|---|---|
| `POST` | `/api/spaces/[name]/files` | None* | Record file metadata after client-side Supabase Storage upload |
| `GET` | `/api/spaces/[name]/files` | None* | List files attached to a space |
| `DELETE` | `/api/spaces/[name]/files/[fileId]` | Owner | Delete a file record + storage object |

### Auth

Auth is handled entirely by Supabase client-side. No custom auth API routes needed.

```typescript
// Sign up — client-side
await supabase.auth.signUp({ email, password });

// Log in — client-side
await supabase.auth.signInWithPassword({ email, password });

// Log out — client-side
await supabase.auth.signOut();

// Get current user — client-side
const { data: { user } } = await supabase.auth.getUser();
```

### Cron (Cleanup)

| Method | Route | Trigger | Description |
|---|---|---|---|
| `GET` | `/api/cron/cleanup` | Vercel Cron | Delete expired spaces and their files from storage |

---

## 6. Validation Schemas (Zod 4)

Schemas live in `lib/schemas/` and are imported by both client components (form validation) and API routes (request validation). No shared package needed — they're just files in the same project.

```typescript
// lib/schemas/space.schema.ts
import { z } from "zod";

export const DURATION_OPTIONS = [
  { label: "5 minutes", value: 5 },
  { label: "1 hour", value: 60 },
  { label: "10 hours", value: 600 },
  { label: "1 day", value: 1440 },
  { label: "10 days", value: 14400 },
] as const;

const durationValues = DURATION_OPTIONS.map(d => d.value);

// Reserved names that conflict with routes
const RESERVED_NAMES = [
  "api", "auth", "login", "register", "dashboard",
  "admin", "settings", "new", "space", "spaces",
];

export const spaceNameSchema = z
  .string()
  .min(3, "Name must be at least 3 characters")
  .max(24, "Name must be at most 24 characters")
  .regex(/^[a-zA-Z][a-zA-Z-]*[a-zA-Z]$/, "Only letters and hyphens allowed, must start and end with a letter")
  .refine(
    (name) => !RESERVED_NAMES.includes(name.toLowerCase()),
    "This name is reserved"
  );

export const createSpaceSchema = z.object({
  name: spaceNameSchema,
  content: z.string().min(1, "Content is required").max(50000, "Content too long"),
  duration: z.number().refine((v) => durationValues.includes(v), "Invalid duration"),
  password: z.string().min(4, "Password must be at least 4 characters").optional(),
});

export const updateSpaceSchema = z.object({
  content: z.string().min(1).max(50000).optional(),
  duration: z.number().refine((v) => durationValues.includes(v)).optional(),
});
```

---

## 7. Styling

### Tailwind CSS v4 — CSS-Native Configuration

Tailwind v4 uses CSS-based configuration instead of a JavaScript config file. All theming lives in `app/globals.css`:

```css
/* app/globals.css */
@import "tailwindcss";

@theme {
  /* Colors */
  --color-primary: #10b981;
  --color-primary-foreground: #ffffff;
  --color-destructive: #ef4444;
  --color-destructive-foreground: #ffffff;
  --color-muted: #6b7280;

  /* Fonts */
  --font-sans: "Inter", system-ui, sans-serif;
  --font-mono: "JetBrains Mono", "Fira Code", monospace;

  /* Radius */
  --radius-lg: 0.75rem;
  --radius-md: 0.5rem;
  --radius-sm: 0.25rem;
}
```

No `tailwind.config.ts` file. This is a breaking change from Tailwind v3.

### shadcn/ui with Luma Style

Initialize the project with shadcn's Luma preset for a softer, modern visual feel:

```bash
npx shadcn@latest init --style luma
```

Or apply Luma to an existing project:

```bash
npx shadcn@latest apply
```

### Styling Rules

1. **Use shadcn/ui components** as the base — Button, Input, Dialog, Dropdown, Card, Toast (Sonner), Skeleton, etc.
2. **No custom CSS files.** All styling through Tailwind utility classes. The v1 project had 500+ lines of SCSS — this should be zero custom CSS.
3. **Dark mode first.** Use Tailwind's `dark:` variant. Store preference in localStorage via Zustand, with system detection as default.
4. **Typography:** Use `Inter` for UI text and `JetBrains Mono` for the space content textarea (monospace feel matching v1).
5. **Animations:** Use Tailwind's built-in transitions + `tailwindcss-animate` plugin (comes with shadcn/ui). Keep animations subtle — fade-ins, scale transitions.
6. **Responsive:** Mobile-first. Use Tailwind's `sm:`, `md:`, `lg:` prefixes. Target mobile, tablet, and desktop.
7. **Toast notifications:** Use shadcn/ui's Sonner integration instead of custom notification components.

### UI Improvements Over v1

- **Home page:** Grid of recent spaces as cards (not a plain list). Each card shows space name, content preview, time remaining, file count.
- **Space page:** Split layout on desktop — editor on the left, file panel on the right. Stacked on mobile.
- **File uploads:** Drag-and-drop zone with image preview thumbnails. File list with download/delete actions.
- **Better empty states:** Illustrated empty states when no spaces exist, when a space is not found.
- **Password dialog:** Modal prompt when accessing a password-protected space.
- **User dashboard:** Table/grid of user's spaces with search, sort, and bulk delete.
- **Loading skeletons:** Use shadcn/ui Skeleton component for all loading states instead of text like "Loading...".

---

## 8. Key Implementation Details

### 8.1 Supabase Client Setup

Create two clients — one for the browser, one for server-side Route Handlers.

```typescript
// lib/supabase/client.ts
"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/types/database.types";

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
}
```

```typescript
// lib/supabase/server.ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/types/database.types";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );
}
```

**Note:** New Supabase projects (2026+) use **publishable keys** instead of the legacy `anon` key. The variable is named `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` to reflect this.

### 8.2 Polling with TanStack Query

Instead of WebSockets, poll every 5 seconds while the user is viewing a space. This is functionally indistinguishable from real-time for a clipboard app.

```typescript
// hooks/use-space.ts
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export function useSpace(name: string) {
  return useQuery({
    queryKey: ["space", name],
    queryFn: async () => {
      const res = await fetch(`/api/spaces/${name}`);
      if (!res.ok) throw new Error(res.statusText);
      return res.json();
    },
    refetchInterval: 5000,                 // Poll every 5 seconds
    refetchIntervalInBackground: false,    // Stop when tab is not focused
  });
}

export function useUpdateSpace(name: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { content?: string; duration?: number }) => {
      const res = await fetch(`/api/spaces/${name}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(res.statusText);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["space", name], data);
    },
  });
}
```

### 8.3 Space Expiration

Use **lazy deletion** as the primary strategy, with an optional Vercel Cron as backup.

**Lazy deletion (primary):** Filter out and delete expired spaces at query time.

```typescript
// In GET /api/spaces/[name]/route.ts
export async function GET(req: Request, { params }: { params: { name: string } }) {
  const supabase = await createClient();
  const { data: space } = await supabase
    .from("spaces")
    .select("*")
    .eq("name", params.name)
    .single();

  if (!space) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Lazy deletion: if expired, delete and return 404
  if (new Date(space.expires_at) < new Date()) {
    await supabase.from("spaces").delete().eq("id", space.id);
    // Also clean up files from Supabase Storage
    await supabase.storage.from("space-files").remove(
      (await supabase.from("files").select("storage_path").eq("space_id", space.id).then(r => r.data))
        ?.map(f => f.storage_path) ?? []
    );
    return NextResponse.json({ error: "Space expired" }, { status: 404 });
  }

  return NextResponse.json(space);
}
```

**Vercel Cron (backup):** Clean up orphaned expired spaces that nobody accessed.

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/cleanup",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

```typescript
// app/api/cron/cleanup/route.ts
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  // Verify the request is from Vercel Cron
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();

  // Find expired spaces
  const { data: expired } = await supabase
    .from("spaces")
    .select("id")
    .lt("expires_at", new Date().toISOString());

  if (!expired?.length) return NextResponse.json({ cleaned: 0 });

  const ids = expired.map(s => s.id);

  // Get file paths to clean from storage
  const { data: files } = await supabase
    .from("files")
    .select("storage_path")
    .in("space_id", ids);

  // Delete from storage
  if (files?.length) {
    await supabase.storage.from("space-files").remove(files.map(f => f.storage_path));
  }

  // Delete spaces (cascades to files table)
  await supabase.from("spaces").delete().in("id", ids);

  return NextResponse.json({ cleaned: ids.length });
}
```

### 8.4 File Upload Flow

Files upload **directly from the client to Supabase Storage**, bypassing the API routes entirely. This avoids Vercel's 4.5MB body limit.

```typescript
// hooks/use-file-upload.ts
"use client";

import { createClient } from "@/lib/supabase/client";

export function useFileUpload(spaceName: string, spaceId: string) {
  const supabase = createClient();

  async function uploadFile(file: File) {
    // 1. Upload directly to Supabase Storage
    const path = `${spaceName}/${crypto.randomUUID()}-${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from("space-files")
      .upload(path, file);

    if (uploadError) throw uploadError;

    // 2. Record metadata via API route
    const res = await fetch(`/api/spaces/${spaceName}/files`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filename: file.name,
        storage_path: path,
        mime_type: file.type,
        size_bytes: file.size,
        space_id: spaceId,
      }),
    });

    if (!res.ok) throw new Error("Failed to save file metadata");
    return res.json();
  }

  return { uploadFile };
}
```

**Limits:**
- Max 10MB per file (Supabase Storage free tier allows up to 50MB, but we cap it lower)
- Max 50MB total per space
- Allowed MIME types: images, PDFs, text, common document formats

### 8.5 Authentication

Supabase Auth handles everything. No custom auth routes needed.

```typescript
// hooks/use-auth.ts
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => setUser(session?.user ?? null)
    );

    return () => subscription.unsubscribe();
  }, []);

  return { user, loading };
}
```

Auth middleware refreshes the session on every request:

```typescript
// middleware.ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  await supabase.auth.getUser();
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
```

Auth is **optional** — all space CRUD works without login. Logged-in users get: space ownership, private spaces, dashboard, and space deletion.

### 8.6 Rate Limiting

Use Upstash Redis with `@upstash/ratelimit` for serverless-friendly rate limiting.

```typescript
// lib/rate-limit.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// 30 requests per hour for write operations
export const writeRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(30, "1 h"),
  prefix: "rl:write",
});

// 100 requests per hour for read operations
export const readRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, "1 h"),
  prefix: "rl:read",
});
```

Usage in a Route Handler:

```typescript
// In any API route
import { writeRateLimiter } from "@/lib/rate-limit";
import { headers } from "next/headers";

const headerList = await headers();
const ip = headerList.get("x-forwarded-for") ?? "anonymous";
const { success } = await writeRateLimiter.limit(ip);

if (!success) {
  return NextResponse.json({ error: "Too many requests" }, { status: 429 });
}
```

### 8.7 Space Name Rules

- Allow letters and hyphens (e.g., `my-notes`) — v1 only allowed letters.
- Must start and end with a letter (no `--double-dash` or `-leading-hyphen`).
- 3-24 characters (increased from v1's 16).
- Normalized to lowercase on the server.
- Reserved names blocked: `api`, `auth`, `login`, `register`, `dashboard`, `admin`, `settings`, `new`, `space`, `spaces`.

---

## 9. Environment Variables

```env
# .env.local.example

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=pk_your-publishable-key

# Supabase service role (server-side only — for cron cleanup and admin operations)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Upstash Redis
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-redis-token

# Vercel Cron secret
CRON_SECRET=your-cron-secret

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

No `DATABASE_URL`, no `S3_*`, no `PORT`, no `CORS_ORIGINS` — Supabase handles all of that.

---

## 10. Supabase Local Development

Instead of Docker Compose with Postgres/Redis/MinIO, use the Supabase CLI for local development:

```bash
# Install Supabase CLI
npm install -g supabase

# Initialize (already done — config is in supabase/ directory)
supabase init

# Start local Supabase (Postgres, Auth, Storage, Realtime — all in Docker)
supabase start

# Apply migrations
supabase db push

# Generate TypeScript types after schema changes
supabase gen types typescript --local > lib/types/database.types.ts

# Stop local Supabase
supabase stop
```

The Supabase CLI runs a full local stack (Postgres, GoTrue auth, Storage, PostgREST) via Docker. You get the same API surface locally as in production.

---

## 11. Build & Run Commands

```bash
# Install dependencies
npm install

# Start Supabase local dev stack
supabase start

# Apply database migrations
supabase db push

# Generate types
supabase gen types typescript --local > lib/types/database.types.ts

# Start Next.js dev server (Turbopack, port 3000)
npm run dev

# Build for production
npm run build

# Type-check
npx tsc --noEmit

# Lint
npm run lint

# Add a shadcn/ui component
npx shadcn@latest add button
npx shadcn@latest add dialog
npx shadcn@latest add sonner

# Create a new database migration
supabase migration new your_migration_name
```

---

## 12. Deployment

### Vercel (everything)

1. Push to GitHub.
2. Connect the repo to Vercel.
3. Set environment variables in Vercel dashboard.
4. Vercel auto-detects Next.js, builds with Turbopack, deploys.

That's it. Frontend, API routes, and cron — all in one deployment.

### Supabase (database, auth, storage)

1. Create a project at [supabase.com](https://supabase.com).
2. Run migrations: `supabase db push --linked`.
3. Create a Storage bucket called `space-files` (public or with RLS policies).
4. Copy the project URL and publishable key to Vercel env vars.

### Upstash (rate limiting)

1. Create a Redis database at [upstash.com](https://upstash.com).
2. Copy the REST URL and token to Vercel env vars.

### Free Tier Limits

| Service | Limit | Enough? |
|---|---|---|
| **Vercel** | 100GB bandwidth, 100k function invocations/month | Yes |
| **Supabase** | 500MB database, 1GB file storage, 50k MAU auth, 5GB bandwidth | Yes |
| **Upstash** | 10k commands/day, 256MB | Yes |

**Total: $0/month** for a small-to-medium project.

---

## 13. Implementation Order

Build in phases. Each phase produces a working, deployable app.

### Phase 1 — Foundation (Core Feature Parity with v1)

1. Scaffold Next.js 16 project with TypeScript.
2. Initialize shadcn/ui with Luma style: `npx shadcn@latest init --style luma`.
3. Configure Tailwind v4 theme in `globals.css` (`@theme` block with colors, fonts).
4. Set up Supabase project + local dev with CLI.
5. Write database migrations for `spaces` table.
6. Create Supabase client files (`lib/supabase/client.ts`, `lib/supabase/server.ts`).
7. Write Zod schemas for space validation (`lib/schemas/space.schema.ts`).
8. Build API routes: `POST /api/spaces`, `GET /api/spaces/[name]`, `PATCH /api/spaces/[name]`, `GET /api/spaces/recent`.
9. Build the home page: space name input with validation, recent spaces grid.
10. Build the space page: editor with textarea, duration picker, save button, copy button.
11. Wire up TanStack Query with 5-second polling (`hooks/use-space.ts`).
12. Add Sonner toast notifications.
13. Add dark/light theme toggle with Zustand.
14. Implement lazy deletion for expired spaces.
15. Deploy to Vercel + Supabase cloud.

### Phase 2 — File Attachments

1. Write database migration for `files` table.
2. Create Supabase Storage bucket `space-files`.
3. Build `hooks/use-file-upload.ts` for direct client-to-Supabase uploads.
4. Build file upload UI (drag-and-drop zone with react-dropzone or native).
5. Build file list component with download links and delete buttons.
6. Build API routes for file metadata: `POST /api/spaces/[name]/files`, `GET /api/spaces/[name]/files`, `DELETE /api/spaces/[name]/files/[fileId]`.
7. Add file cleanup to lazy deletion and Vercel Cron.

### Phase 3 — Authentication & Permissions

1. Set up Supabase Auth (enable email/password in dashboard).
2. Create `middleware.ts` for session refresh.
3. Build `hooks/use-auth.ts`.
4. Build login and register pages using shadcn/ui forms.
5. Add navbar auth state (show login/register or user avatar + logout).
6. Implement space ownership (set `owner_id` when logged-in user creates a space).
7. Build user dashboard page (list of owned spaces with delete action).
8. Add private space support with RLS policies.
9. Add optional space passwords (bcrypt hash, prompt dialog on access).

### Phase 4 — Polish

1. Set up Upstash Redis rate limiting.
2. Add proper error pages (`not-found.tsx`, `error.tsx`).
3. Add loading skeletons for all loading states.
4. Add empty state illustrations.
5. Add link detection in space content (carry over from v1).
6. Improve responsive design and mobile UX.
7. Set up Vercel Cron for background cleanup.
8. Set up GitHub Actions CI (lint, typecheck, build).
9. Add OG metadata for shared space links (Next.js `generateMetadata`).
10. Write a README.

---

## 14. What NOT to Carry Over from v1

These are patterns from the original codebase that should be avoided:

1. **Plain JavaScript on the backend.** Everything is TypeScript.
2. **Manual date math.** Use `date-fns` for all formatting and relative time.
3. **In-memory rate limiting (Map that resets on restart).** Use Upstash Redis.
4. **SCSS files (500+ lines).** Use Tailwind utility classes exclusively.
5. **Hand-rolled SVG icon components (Icons.tsx).** Use Lucide React.
6. **Manual fetch + useState for server data.** Use TanStack Query.
7. **Arbitrary duration values (0, 1, 10, 24, 240).** Use minute-based values (5, 60, 600, 1440, 14400).
8. **Hardcoded CORS origins.** Not needed — API routes are same-origin in Next.js.
9. **GitHub Pages with base path hacks.** Deploy to Vercel — no base path needed.
10. **Mongoose-only validation.** Use Zod schemas for all request validation.
11. **Separate frontend and backend repositories/deployments.** Everything is one Next.js project.
12. **Custom notification component.** Use Sonner (shadcn/ui integration).
13. **Custom hamburger menu animation (hamburger.scss).** Use shadcn/ui's Sheet or DropdownMenu components.
