# Kliboard v2

Temporary text clipboard web app. Users create named "spaces," paste text, share via space name. Spaces auto-delete after a chosen duration. No login required for basic features.

## Tech Stack

- **Framework:** Next.js 16 (App Router, Turbopack)
- **Language:** TypeScript 5.x (strict, entire stack)
- **React:** 19.x (Server Components)
- **Server state:** TanStack Query 5.x (caching, polling every 5s, optimistic updates)
- **Client state:** Zustand 5.x (theme, notifications)
- **Styling:** Tailwind CSS 4.x (CSS-native config via `@theme` in `globals.css`, no `tailwind.config.ts`)
- **Components:** shadcn/ui (Luma style) built on Radix UI + Tailwind
- **Validation:** Zod 4.x (shared between client and server)
- **Database:** Supabase (PostgreSQL) with JS client v2.x
- **Auth:** Supabase Auth (email/password + OAuth)
- **File storage:** Supabase Storage (direct client uploads)
- **Rate limiting:** Upstash Redis + @upstash/ratelimit
- **Date handling:** date-fns 3.x+
- **Icons:** Lucide React
- **Animation:** Motion (`motion/react`) — for state transitions, exit, and interaction. Above-the-fold entry animations use CSS (see animation rules). Variants in `lib/animations.ts`
- **Deployment:** Vercel (free tier)

## Project Structure

```
app/                  # Next.js App Router pages and API routes
  api/                # Route Handlers (spaces CRUD, files, cron cleanup)
  space/[name]/       # Dynamic space view/edit page
  login/              # Auth pages
  register/
  dashboard/          # Authenticated user's space list
components/
  ui/                 # shadcn/ui components
  space/              # Space-specific components (editor, viewer, file upload, etc.)
  layout/             # Navbar, footer, theme toggle
  shared/             # Link detector, recent spaces grid
hooks/                # TanStack Query hooks (use-space, use-auth, use-file-upload)
stores/               # Zustand stores (theme, notifications)
lib/
  supabase/           # Browser + server Supabase clients, middleware helper
  schemas/            # Zod validation schemas (shared client + server)
  types/              # Auto-generated Supabase database types
  rate-limit.ts       # Upstash rate limiter setup
  constants.ts        # Duration options, reserved names, limits
  utils.ts            # Shared utilities
supabase/
  migrations/         # SQL migration files
middleware.ts         # Next.js middleware (auth session refresh)
```

## Code Rules

### Never Commit Automatically
Never create git commits unless the user explicitly asks. No auto-commits, no committing as part of tool initialization, no committing after completing a task.

### Minimal Comments
Do not write comments in code unless absolutely necessary. No routine inline comments, no block comments describing obvious logic, no JSDoc on every function, no TODO comments. Only add a comment when the logic is genuinely non-obvious and cannot be clarified through better naming or structure.

### No Empty Catch Blocks
Every `catch` block must handle the error. Options include: logging, rethrowing, returning an error response, or setting error state. An empty `catch {}` or `catch (e) {}` is never acceptable.

### Show Plan Before Implementation
Always present an implementation plan to the user and get approval before making code changes. This applies to new features, refactors, bug fixes, and any non-trivial modifications. The plan should outline which files will be created/modified and what changes will be made.

### Keep CLAUDE.md Current
Treat this file as living documentation. When the user shares a notable rule, convention, anti-pattern, or decision during a session, add it here (or update/remove an outdated entry) so future sessions inherit the lesson. Keep additions terse and in the existing bullet style. Don't only append — prune contradicted or stale rules so this file doesn't enforce old habits.

## Conventions

- **No custom CSS files.** All styling via Tailwind utility classes
- **Dark mode first.** Use Tailwind `dark:` variant, system detection as default
- **Design system:** "The Architectural Shadow" — see `design/DESIGN.md` for full spec. Key rules: no 1px borders for sectioning (use tonal background shifts), no #FFFFFF, no glow/scanline effects, minimum `sm` (0.125rem) border-radius, ambient shadows only
- **Fonts:** Space Grotesk for headings (`font-heading`), Inter for body/UI (`font-sans`), JetBrains Mono for space content textarea (`font-mono`)
- **Toast notifications:** Use Sonner (shadcn/ui integration), not custom components
- **Icons:** Use Lucide React, not hand-rolled SVGs
- **Loading states:** Use shadcn/ui Skeleton components, not "Loading..." text
- **Async feedback is mandatory.** Every user-triggered async action (save, upload, delete, fetch-to-update) must show progress: a determinate progress bar when measurable (uploads, batch ops), an inline spinner or disabled button state otherwise. No silent in-flight operations
- **Manual sync over polling.** Users click a sync button to refresh space content; no automatic refetchInterval
- **Lazy deletion** as primary expiration strategy, Vercel Cron as backup
- **File uploads** go directly from client to Supabase Storage (bypasses Vercel 4.5MB limit)
- **Auth is optional.** All space CRUD works without login
- **Two independent gates per space.** `is_private` gates *reading*, `is_locked` gates *writing*. Don't conflate them
- **Private spaces** are password-shared: owner sets a password, readers POST proof of it to `/api/spaces/[name]/access` and get an HttpOnly access-grant cookie. The grant HMAC is bound to `password_hash`, so rotating or clearing the password revokes every outstanding grant. Requires `SPACE_ACCESS_SECRET` (≥32 chars); the helpers fail closed without it
- **Private always means end-to-end encrypted.** The password never leaves the browser. `lib/crypto/space-crypto.ts` runs PBKDF2(600k) → HKDF to split it into a KEK (stays client-side) and an `auth_token` (bcrypt'd into `password_hash`, sent in place of a password). A random per-space DEK encrypts content and files; it is wrapped under the KEK and stored as `wrapped_dek`. Rotation re-wraps the DEK — never re-encrypts data
- **Never send `wrapped_dek` before the access check passes.** The pre-auth 403 carries only `kdf_salt`/`kdf_iterations`, which are useless alone. Leaking the wrapped key alongside ciphertext would turn an online, rate-limited attack into an offline one
- **Encryption happens at the hook boundary** (`hooks/use-space.ts`, `hooks/use-file-upload.ts`) so components pass plaintext. The DEK lives in `lib/crypto/key-session.ts` (memory + non-extractable `CryptoKey` in IndexedDB, 12h) — read it with `useSpaceKey`, never re-derive it in a component
- **Owners must unlock too.** The server holds no key, so `fetchSpace` throws `requiresPassword` with the space's KDF params when the DEK is missing. Owner unlock is local (unwrap `wrapped_dek`); non-owners POST `auth_token` to `/access` first
- **Uploads into an existing private space use signed upload URLs** from `/api/spaces/[name]/files/upload-url` — RLS can't see password-holders, and the storage policy denies direct writes into private folders. Encrypted objects use uuid-only paths (a filename in the path leaks it) and `application/octet-stream`
- **Authorize private spaces in the route, not via RLS.** Password-holders aren't authenticated as the owner, so RLS can't see them — routes read the space with the admin client and call `hasSpaceAccess()` from `lib/space-authz.ts`. Gate every read/write path that touches space content or files
- **Never return `password_hash` or `claim_token_hash`** in an API response; destructure them out
- **Space names:** letters and hyphens, 3-24 chars, start/end with letter, lowercase on server
- **Duration values in minutes:** 5, 60, 600, 1440, 14400
- **Supabase publishable key** (not legacy anon key): `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- **Animation rules:**
  - Use `motion/react` (`AnimatePresence` + `motion.*`) for state changes, exit animations, list reorder, layout morphs, and gestures. Use CSS for hover/focus and for one-shot entry/mount animations on above-the-fold (LCP) content — never gate the first paint on JS. Motion's `initial="hidden"` SSRs `opacity:0`, which delays LCP until hydration; a CSS entry animation plays at first paint instead. Reuse `.animate-enter` (+ `animate-enter-1/2/3` stagger) from `globals.css`.
  - Shared variants and timing live in `lib/animations.ts` — import them, don't redefine. Default duration 150–250ms, ease `[0.22, 1, 0.36, 1]`
  - Always wrap dynamic lists in `<AnimatePresence>` so removals animate
  - `layout` prop only for genuine position morphs (e.g. file pending↔stored, list reorder). Avoid blanket use — perf cost
  - Always honor `useReducedMotion()` (disable `layout`, skip non-essential motion)
  - Don't animate: theme toggle, polling-driven content updates (every 5s), Radix/Base UI components (already animated), skeletons

## What NOT to Use

- Prisma (cold start overhead in serverless)
- Socket.IO / WebSockets (incompatible with serverless)
- Separate backend (Express, Hono)
- Monorepo / Turborepo
- Docker Compose for local dev (use Supabase CLI)
- SCSS or custom CSS files
- Manual fetch + useState patterns (use TanStack Query)
- Custom notification components (use Sonner)

## Commands

```bash
npm run dev          # Start dev server (Turbopack, port 3000)
npm run build        # Production build
npm run lint         # ESLint
npx tsc --noEmit     # Type-check
supabase start       # Local Supabase stack
supabase db push     # Apply migrations
supabase gen types typescript --local > lib/types/database.types.ts  # Regen types
npx shadcn@latest add <component>  # Add shadcn/ui component
```
