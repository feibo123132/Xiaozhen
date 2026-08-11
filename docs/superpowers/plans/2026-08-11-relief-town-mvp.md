# Relief Town MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a mobile-first Web MVP in which visitors explore a pannable illustrated town, the curator publishes real interview viewpoints, worries grow as published responses accumulate, and participants claim persistent pseudonymous traveler identities.

**Architecture:** Use one Next.js App Router application for public pages, traveler pages, admin pages, and server route handlers. Keep business rules in framework-independent feature modules, persist relational state with Prisma and SQLite for the pilot, and access data through focused repositories so a later PostgreSQL migration does not affect page components. Render the town as an accessible DOM/SVG scene with pan and zoom plus a semantic list fallback.

**Tech Stack:** Node.js 22, Next.js App Router, React, TypeScript, vanilla CSS with design tokens, Prisma 7, SQLite, Zod, Vitest, Testing Library, and Playwright.

**Specification:** `docs/superpowers/specs/2026-08-11-relief-town-design.md`

---

## Delivery boundaries

This plan has three independently testable phases:

1. **Public Town:** seeded content, current event, illustrated map, worry details, traveler profiles, growth, and list fallback.
2. **Curator Loop:** protected admin, event and worry management, map placement, traveler creation, viewpoint publishing, and growth updates.
3. **Traveler Loop:** one-time claim, persistent login, profile editing, self-hide, permanent deletion requests, and release verification.

Do not add audio upload, transcription, AI-authored content, public posting/comments, realtime multiplayer, free-roam controls, payment, achievements, or custom asset uploads.

## Target file map

```text
package.json                         scripts and dependencies
next.config.ts                       Next.js runtime configuration
tsconfig.json                        TypeScript configuration
eslint.config.mjs                    lint rules
vitest.config.ts                     unit/component test configuration
playwright.config.ts                 end-to-end configuration
prisma.config.ts                     Prisma 7 datasource configuration
prisma/schema.prisma                 relational schema
prisma/seed.ts                       pilot assets, map, event, worries, admin
src/app/                             App Router pages and route handlers
src/components/                      shared UI and accessible primitives
src/features/growth/                 pure life-stage rule
src/features/town/                   scene, map viewport, list fallback
src/features/content/                public queries and serialization
src/features/admin/                  curator forms and commands
src/features/auth/                   passwords, tokens, cookies, sessions
src/features/travelers/              claim, profile, hide, removal requests
src/lib/db.ts                        Prisma client and SQLite adapter
src/lib/http.ts                      same-origin and response helpers
src/lib/env.ts                       validated environment configuration
src/generated/prisma/                generated Prisma client, gitignored
public/town/                          read-only SVG map and sprite assets
tests/e2e/                            Playwright journeys
```

Each feature directory owns its business rules, tests, and repository functions. Page files only parse input, call feature functions, and render results.

### Task 1: Scaffold the application and test harness

**Files:**
- Create: `package.json`
- Create: `next.config.ts`
- Create: `tsconfig.json`
- Create: `eslint.config.mjs`
- Create: `vitest.config.ts`
- Create: `src/test/setup.ts`
- Create: `src/app/layout.tsx`
- Create: `src/app/page.tsx`
- Create: `src/app/globals.css`
- Modify: `.gitignore`
- Test: `src/app/page.test.tsx`

- [ ] **Step 1: Write a failing shell test for required project files**

Run: `node -e "for (const f of ['package.json','src/app/layout.tsx','src/app/page.tsx']) require('fs').accessSync(f)"`

Expected: FAIL because the application files do not exist.

- [ ] **Step 2: Create the minimal Next.js package and configuration**

Use `apply_patch` to create the files. Required scripts:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:seed": "tsx prisma/seed.ts"
  }
}
```

Install runtime dependencies with:

```powershell
npm install next react react-dom zod qrcode @prisma/client @prisma/adapter-better-sqlite3 better-sqlite3
npm install -D typescript @types/node @types/react @types/react-dom @types/better-sqlite3 @types/qrcode eslint eslint-config-next prisma tsx vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event @playwright/test
```

- [ ] **Step 3: Add the first component test**

```tsx
import { render, screen } from "@testing-library/react";
import HomePage from "./page";

it("introduces the town", () => {
  render(<HomePage />);
  expect(screen.getByRole("heading", { name: "解忧小镇" })).toBeInTheDocument();
});
```

- [ ] **Step 4: Run baseline checks**

Run: `npm test -- src/app/page.test.tsx && npm run typecheck && npm run lint`

Expected: all commands PASS.

- [ ] **Step 5: Commit**

```powershell
git add package.json package-lock.json next.config.ts tsconfig.json eslint.config.mjs vitest.config.ts src .gitignore
git commit -m "build: scaffold relief town web app"
```

### Task 2: Encode growth and publication rules as pure domain logic

**Files:**
- Create: `src/features/growth/calculate-growth-stage.ts`
- Test: `src/features/growth/calculate-growth-stage.test.ts`
- Create: `src/features/content/status.ts`
- Test: `src/features/content/status.test.ts`

- [ ] **Step 1: Write failing growth tests**

```ts
import { calculateGrowthStage } from "./calculate-growth-stage";

const thresholds = [0, 1, 3, 6];

it.each([[0, 0], [1, 1], [2, 1], [3, 2], [6, 3]])(
  "%i published viewpoints selects stage %i",
  (count, stage) => expect(calculateGrowthStage(count, thresholds)).toBe(stage),
);

it("rejects unsorted thresholds", () => {
  expect(() => calculateGrowthStage(2, [0, 3, 1])).toThrow();
});
```

- [ ] **Step 2: Verify the test fails**

Run: `npm test -- src/features/growth/calculate-growth-stage.test.ts`

Expected: FAIL because the module is missing.

- [ ] **Step 3: Implement the smallest deterministic rule**

`calculateGrowthStage` validates non-negative sorted thresholds and returns the highest reached index. Add helpers that only treat `published` viewpoints as public and growth-eligible.

- [ ] **Step 4: Run tests**

Run: `npm test -- src/features/growth src/features/content`

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add src/features/growth src/features/content
git commit -m "feat: define life growth and publication rules"
```

### Task 3: Add the relational schema, repository boundary, and pilot seed

**Files:**
- Create: `prisma.config.ts`
- Create: `prisma/schema.prisma`
- Create: `prisma/seed.ts`
- Create: `src/lib/env.ts`
- Create: `src/lib/db.ts`
- Create: `src/features/content/public-repository.ts`
- Test: `src/features/content/public-repository.test.ts`
- Create: `.env.example`

- [ ] **Step 1: Write a failing repository contract test**

The test creates an isolated temporary SQLite database, seeds one active event, one published worry, one hidden viewpoint, and one published viewpoint, then asserts:

```ts
expect(await repository.getCurrentEvent()).toMatchObject({ title: "第一次路演" });
expect(await repository.getWorryBySlug("leave-or-stay"))
  .toMatchObject({ publishedViewpointCount: 1, growthStage: 1 });
```

It must also assert that drafts and hidden viewpoints never appear in public results.

- [ ] **Step 2: Verify the contract fails**

Run: `npm test -- src/features/content/public-repository.test.ts`

Expected: FAIL because schema and repository are missing.

- [ ] **Step 3: Define the Prisma models**

Create models matching the approved spec:

```text
Event, EventFeature, Worry, LifeAsset, MapPlacement,
Traveler, AccountToken, Viewpoint, AdminUser, Session, RemovalRequest, AuthThrottle
```

Required database constraints:

- unique event and worry slugs;
- unique event/worry pair in `EventFeature`;
- one active placement per worry;
- unique token hash and session token hash;
- viewpoint must reference one worry and one traveler;
- removal request must reference one viewpoint and one traveler;
- one authentication throttle record per hashed scope/identity key;
- timestamps on all mutable records.

- [ ] **Step 4: Configure Prisma 7 and create the first migration**

Use `DATABASE_URL="file:./prisma/dev.db"` in local `.env`. Instantiate Prisma with `@prisma/adapter-better-sqlite3` only inside `src/lib/db.ts`.

Run: `npx prisma generate && npx prisma migrate dev --name init`

Expected: generated client and a successful initial migration.

- [ ] **Step 5: Add read-only pilot seed data**

Seed:

- one active roadshow event;
- one forest and one pasture map zone;
- at least six tree/animal assets with four growth-stage image paths;
- ten representative worries, with three to five featured;
- three pseudonymous traveler profiles and several published viewpoints;
- one admin account whose password is sourced from `ADMIN_BOOTSTRAP_PASSWORD`.

Never seed raw recordings or real personal information.

- [ ] **Step 6: Implement and verify the repository**

Run: `npm run db:seed && npm test -- src/features/content/public-repository.test.ts`

Expected: PASS and public serialization excludes protected fields.

- [ ] **Step 7: Commit**

```powershell
git add prisma prisma.config.ts src/lib src/features/content .env.example .gitignore
git commit -m "feat: add relief town data model and pilot seed"
```

### Task 4: Build the visual system and accessible application shell

**Files:**
- Create: `src/components/site-header.tsx`
- Create: `src/components/surface.tsx`
- Create: `src/components/focus-link.tsx`
- Create: `src/app/not-found.tsx`
- Modify: `src/app/layout.tsx`
- Modify: `src/app/globals.css`
- Test: `src/components/site-header.test.tsx`

- [ ] **Step 1: Write failing shell accessibility tests**

Assert the header exposes navigation to the current event, full town, and traveler entry; assert there is one main landmark and a keyboard skip link.

- [ ] **Step 2: Verify failure**

Run: `npm test -- src/components/site-header.test.tsx`

Expected: FAIL because components do not exist.

- [ ] **Step 3: Implement the restrained visual language**

Use custom CSS tokens for paper, ink, moss, warm sun, night blue, borders, spacing, focus rings, and reduced motion. The public experience should resemble an illustrated field notebook and living scroll, not an admin dashboard or generic gradient landing page. Use local system and bundled fonts only in MVP.

- [ ] **Step 4: Verify responsive and accessible shell**

Run: `npm test -- src/components/site-header.test.tsx && npm run lint && npm run typecheck`

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add src/app src/components
git commit -m "feat: establish relief town visual system"
```

### Task 5: Deliver the current-event landing page

**Files:**
- Create: `src/features/events/current-event.ts`
- Create: `src/features/events/event-hero.tsx`
- Create: `src/features/events/featured-worries.tsx`
- Modify: `src/app/page.tsx`
- Test: `src/app/page.test.tsx`

- [ ] **Step 1: Write failing page tests**

Test the active event title, three to five ordered featured worries, the “进入完整小镇” action, and the empty-event fallback.

- [ ] **Step 2: Verify failure**

Run: `npm test -- src/app/page.test.tsx`

Expected: FAIL on missing event content.

- [ ] **Step 3: Implement server-side event loading and cards**

Keep database access in `current-event.ts`; page components receive a serializable view model. Featured cards show the life name, worry title, growth stage, and response count without suggesting the problem is solved.

- [ ] **Step 4: Verify**

Run: `npm test -- src/app/page.test.tsx && npm run typecheck`

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add src/app/page.tsx src/features/events
git commit -m "feat: add roadshow event landing page"
```

### Task 6: Build the pannable town and semantic fallback

**Files:**
- Create: `src/app/town/page.tsx`
- Create: `src/features/town/town-scene.tsx`
- Create: `src/features/town/town-viewport.tsx`
- Create: `src/features/town/life-hotspot.tsx`
- Create: `src/features/town/worry-list-fallback.tsx`
- Create: `src/features/town/use-pan-zoom.ts`
- Create: `public/town/town-map.svg`
- Create: `public/town/life/*.svg`
- Test: `src/features/town/use-pan-zoom.test.ts`
- Test: `src/features/town/town-scene.test.tsx`

- [ ] **Step 1: Write failing pan/zoom reducer tests**

Cover pointer drag, wheel/pinch scale clamping, reset, bounds, and reduced-motion behavior. Keep geometry logic independent from React.

- [ ] **Step 2: Write failing scene accessibility tests**

Assert every hotspot is a real link with an accessible worry name, forest/pasture labels are exposed, and the fallback list contains the same published worries. Add a missing-stage-asset case that falls back to the nearest available growth image without hiding the worry.

- [ ] **Step 3: Verify failures**

Run: `npm test -- src/features/town`

Expected: FAIL because map modules are missing.

- [ ] **Step 4: Implement the scene**

Use one scalable SVG illustration as the read-only base map and position DOM/SVG hotspots with normalized coordinates. Apply one CSS transform to the scene; never mutate database coordinates during public pan/zoom. Provide visible zoom controls, reset, and a “切换为列表” control.

- [ ] **Step 5: Verify component behavior**

Run: `npm test -- src/features/town && npm run typecheck`

Expected: PASS.

- [ ] **Step 6: Commit**

```powershell
git add src/app/town src/features/town public/town
git commit -m "feat: add explorable relief town map"
```

### Task 7: Add worry details and public traveler profiles

**Files:**
- Create: `src/app/worries/[slug]/page.tsx`
- Create: `src/app/travelers/[id]/page.tsx`
- Create: `src/features/content/worry-detail.tsx`
- Create: `src/features/content/viewpoint-card.tsx`
- Create: `src/features/travelers/public-profile.tsx`
- Test: `src/app/worries/[slug]/page.test.tsx`
- Test: `src/app/travelers/[id]/page.test.tsx`

- [ ] **Step 1: Write failing detail tests**

Test published-only visibility, virtual author links, growth wording, missing records returning not found, and hidden viewpoints disappearing from both pages.

- [ ] **Step 2: Verify failure**

Run: `npm test -- src/app/worries src/app/travelers`

Expected: FAIL because pages are missing.

- [ ] **Step 3: Implement server-rendered detail pages**

The worry page shows the selected life stage, story, published viewpoints, and configurable crisis-resource notice when the curator marks content as sensitive. The traveler page shows only pseudonymous profile fields and published footprints.

- [ ] **Step 4: Verify**

Run: `npm test -- src/app/worries src/app/travelers && npm run typecheck`

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add src/app/worries src/app/travelers src/features/content src/features/travelers
git commit -m "feat: add worry and traveler stories"
```

### Task 8: Protect the curator area and add event/worry editing

**Files:**
- Create: `src/features/auth/password.ts`
- Create: `src/features/auth/session.ts`
- Create: `src/features/auth/guards.ts`
- Create: `src/features/auth/rate-limit.ts`
- Create: `src/lib/http.ts`
- Create: `src/app/admin/login/page.tsx`
- Create: `src/app/admin/layout.tsx`
- Create: `src/app/admin/page.tsx`
- Create: `src/app/admin/events/page.tsx`
- Create: `src/app/admin/worries/page.tsx`
- Create: `src/app/api/admin/session/route.ts`
- Create: `src/app/api/admin/events/route.ts`
- Create: `src/app/api/admin/events/[id]/status/route.ts`
- Create: `src/app/api/admin/worries/route.ts`
- Create: `src/app/api/admin/worries/[id]/status/route.ts`
- Test: `src/features/auth/session.test.ts`
- Test: `src/features/auth/rate-limit.test.ts`
- Test: `src/app/api/admin/events/[id]/status/route.test.ts`
- Test: `src/app/api/admin/worries/[id]/status/route.test.ts`
- Test: `src/app/api/admin/worries/route.test.ts`

- [ ] **Step 1: Write failing password/session tests**

Use Node `scrypt` with unique salts. Store only password and session-token hashes. Test expiry, secure cookie attributes, admin/traveler role separation, same-origin mutation checks, session revocation, and database-backed throttling windows. The rate limiter keys attempts by a hash of endpoint scope plus normalized account identifier, blocks repeated failures, and resets after a successful authentication.

- [ ] **Step 2: Write failing admin route tests**

Assert unauthenticated writes return 401, cross-origin writes return 403, invalid input returns field errors, and valid writes create drafts rather than public content. Add lifecycle tests for valid and invalid transitions: events use `draft → active → ended → archived`, while worries use `draft → published → archived`; an active event may feature only published worries. Verify archived records cannot return directly to a public state.

- [ ] **Step 3: Verify failures**

Run: `npm test -- src/features/auth src/app/api/admin`

Expected: FAIL because auth and routes are missing.

- [ ] **Step 4: Implement minimal admin authentication and CRUD**

Use opaque same-site HTTP-only session cookies and Zod schemas. Do not add third-party auth. Admin forms explicitly save server drafts; mirror unsaved fields to `sessionStorage` and clear them after a successful save. Add explicit publish/end/archive actions that call the lifecycle endpoints and revalidate the current event, town, worry detail, and admin paths after successful transitions.

- [ ] **Step 5: Verify**

Run: `npm test -- src/features/auth src/app/api/admin && npm run typecheck`

Expected: PASS.

- [ ] **Step 6: Commit**

```powershell
git add src/features/auth src/features/admin src/lib/http.ts src/app/admin src/app/api/admin
git commit -m "feat: add protected curator content workflow"
```

### Task 9: Add the map editor, featured ordering, and read-only asset catalog

**Files:**
- Create: `src/app/admin/map/page.tsx`
- Create: `src/features/admin/map-editor.tsx`
- Create: `src/features/admin/asset-picker.tsx`
- Create: `src/features/admin/featured-editor.tsx`
- Create: `src/app/api/admin/placements/route.ts`
- Create: `src/app/api/admin/event-features/route.ts`
- Test: `src/features/admin/map-editor.test.tsx`
- Test: `src/app/api/admin/placements/route.test.ts`

- [ ] **Step 1: Write failing coordinate and permissions tests**

Test normalized coordinates, clamping to map bounds, asset IDs restricted to seeded records, duplicate featured worries rejected, and only admins allowed to mutate placements.

- [ ] **Step 2: Verify failures**

Run: `npm test -- src/features/admin src/app/api/admin/placements`

Expected: FAIL.

- [ ] **Step 3: Implement the editor**

Allow the curator to select a seeded life asset, drag a worry to forest or pasture, preview the public scene, and order three to five featured worries. Do not provide asset upload, edit, or deletion.

- [ ] **Step 4: Verify**

Run: `npm test -- src/features/admin src/app/api/admin/placements && npm run typecheck`

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add src/app/admin/map src/features/admin src/app/api/admin/placements src/app/api/admin/event-features
git commit -m "feat: add curator town editor"
```

### Task 10: Add traveler creation and viewpoint publishing

**Files:**
- Create: `src/app/admin/travelers/page.tsx`
- Create: `src/app/admin/viewpoints/page.tsx`
- Create: `src/features/admin/traveler-form.tsx`
- Create: `src/features/travelers/avatar-catalog.ts`
- Create: `src/features/admin/viewpoint-form.tsx`
- Create: `src/features/admin/publish-viewpoint.ts`
- Create: `src/app/api/admin/travelers/route.ts`
- Create: `src/app/api/admin/viewpoints/route.ts`
- Test: `src/features/admin/publish-viewpoint.test.ts`
- Test: `src/features/admin/traveler-form.test.tsx`
- Test: `src/app/api/admin/viewpoints/route.test.ts`

- [ ] **Step 1: Write failing publication tests**

Test that publication requires worry, traveler, final text, authorization timestamp, and authorization note; repeated idempotency keys create one viewpoint; publish, hide, and delete recalculate growth from published counts. Test that traveler creation accepts only avatar keys from the read-only bundled traveler-avatar catalog.

- [ ] **Step 2: Verify failure**

Run: `npm test -- src/features/admin/publish-viewpoint.test.ts src/app/api/admin/viewpoints/route.test.ts`

Expected: FAIL.

- [ ] **Step 3: Implement manual entry and publication**

The curator creates an unclaimed traveler by choosing a bundled avatar and pseudonym, enters the already-edited final viewpoint, records authorization, previews, and publishes. Use one database transaction for status change and dependent reads; growth remains derived rather than duplicated mutable state. Revalidate public worry and traveler paths after publication or visibility changes.

- [ ] **Step 4: Verify**

Run: `npm test -- src/features/admin src/app/api/admin/viewpoints && npm run typecheck`

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add src/app/admin/travelers src/app/admin/viewpoints src/features/admin src/app/api/admin/travelers src/app/api/admin/viewpoints
git commit -m "feat: publish curated traveler viewpoints"
```

### Task 11: Implement one-time claim, traveler login, and account recovery

**Files:**
- Create: `src/features/auth/account-token.ts`
- Create: `src/features/travelers/claim-traveler.ts`
- Create: `src/features/travelers/traveler-session.ts`
- Create: `src/features/travelers/profile.ts`
- Create: `src/app/claim/[token]/page.tsx`
- Create: `src/app/login/page.tsx`
- Create: `src/app/me/page.tsx`
- Create: `src/app/admin/travelers/[id]/claim-card.tsx`
- Create: `src/app/api/claim/[token]/route.ts`
- Create: `src/app/api/traveler/session/route.ts`
- Create: `src/app/api/me/profile/route.ts`
- Create: `src/app/api/admin/travelers/[id]/claim-token/route.ts`
- Create: `src/app/api/admin/recovery-token/route.ts`
- Test: `src/features/travelers/claim-traveler.test.ts`
- Test: `src/features/travelers/profile.test.ts`
- Test: `src/app/api/claim/[token]/route.test.ts`
- Test: `src/app/api/admin/travelers/[id]/claim-token/route.test.ts`

- [ ] **Step 1: Write failing token state tests**

Cover `initial_claim` only for unclaimed travelers, `credential_recovery` only for claimed travelers, expiry, one-time consumption, purpose mismatch, password reset, and revocation of every previous traveler session after recovery. Test the admin claim-token endpoint creates one active initial token, revokes any previous active initial token, persists only its hash, and returns a short-lived plaintext claim URL exactly once. Add profile tests for ownership, pseudonym validation, bundled-avatar validation, and public cache revalidation.

- [ ] **Step 2: Verify failure**

Run: `npm test -- src/features/travelers/claim-traveler.test.ts src/features/travelers/profile.test.ts src/app/api/claim src/app/api/admin/travelers/[id]/claim-token/route.test.ts`

Expected: FAIL.

- [ ] **Step 3: Implement claim and persistent login**

Store only token hashes. Add an authenticated admin action on each unclaimed traveler row that calls `/api/admin/travelers/[id]/claim-token`, then render the returned one-time URL as a printable/downloadable traveler card and QR. After claim, let the participant set a password and receive an HTTP-only session cookie. The “我的旅人” page can edit only the pseudonym, short public bio, and a key from the bundled avatar catalog through `/api/me/profile`; it cannot edit viewpoint text. Do not collect phone, email, real name, or location.

Apply the database-backed rate limiter from Task 8 to admin login, traveler login, initial claim, and credential recovery. Test that repeated failures produce 429 with a retry time and a successful attempt clears the throttle.

- [ ] **Step 4: Verify**

Run: `npm test -- src/features/auth src/features/travelers src/app/api/claim src/app/api/traveler src/app/api/me/profile src/app/api/admin/travelers && npm run typecheck`

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add src/features/auth src/features/travelers src/app/claim src/app/login src/app/me src/app/api/claim src/app/api/traveler src/app/api/me/profile src/app/admin/travelers src/app/api/admin/travelers src/app/api/admin/recovery-token
git commit -m "feat: add persistent traveler accounts"
```

### Task 12: Add self-hide and permanent deletion requests

**Files:**
- Create: `src/features/travelers/viewpoint-control.ts`
- Create: `src/features/travelers/removal-request.ts`
- Create: `src/app/api/me/viewpoints/[id]/visibility/route.ts`
- Create: `src/app/api/me/removal-requests/route.ts`
- Create: `src/app/admin/removal-requests/page.tsx`
- Create: `src/app/api/admin/removal-requests/[id]/route.ts`
- Test: `src/features/travelers/viewpoint-control.test.ts`
- Test: `src/app/api/me/removal-requests/route.test.ts`

- [ ] **Step 1: Write failing ownership and transition tests**

Test immediate hide/restore only by the owning traveler, growth recalculation, one pending request per viewpoint, cancellation before review, approval to `deleted`, rejection requiring a reason, and public body/author removal after deletion.

- [ ] **Step 2: Verify failure**

Run: `npm test -- src/features/travelers src/app/api/me src/app/api/admin/removal-requests`

Expected: FAIL.

- [ ] **Step 3: Implement the lightest safe flow**

Hiding is immediate and reversible. Permanent deletion uses the queue defined in the spec. Keep only the minimum audit metadata after deletion and never expose it publicly.

- [ ] **Step 4: Verify**

Run: `npm test -- src/features/travelers src/app/api/me src/app/api/admin/removal-requests && npm run typecheck`

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add src/features/travelers src/app/api/me src/app/admin/removal-requests src/app/api/admin/removal-requests
git commit -m "feat: add traveler privacy controls"
```

### Task 13: Add end-to-end journeys and production verification

**Files:**
- Create: `playwright.config.ts`
- Create: `tests/e2e/public-town.spec.ts`
- Create: `tests/e2e/curator-publish.spec.ts`
- Create: `tests/e2e/traveler-claim.spec.ts`
- Create: `tests/e2e/map-fallback.spec.ts`
- Create: `tests/e2e/traveler-privacy.spec.ts`
- Create: `README.md`
- Modify: `package.json`

- [ ] **Step 1: Write failing Playwright journeys**

Cover:

1. mobile visitor opens current event, featured worry, full town, and detail;
2. curator logs in, creates and places a worry, creates a traveler, records authorization, and publishes a viewpoint;
3. participant claims traveler, logs in again, views footprint, and hides a viewpoint;
4. blocked map asset still exposes every worry through the fallback list;
5. participant edits pseudonym/avatar, curator issues a recovery link, old sessions expire, and the recovered account signs in;
6. participant submits and cancels a deletion request; curator approves another request and public content disappears;
7. delayed API responses keep loading/error states usable without duplicate publication;
8. 360 px mobile, 1024 px large display, keyboard navigation, and reduced motion.

- [ ] **Step 2: Verify journeys fail before final wiring**

Run: `npm run test:e2e`

Expected: at least one journey FAIL until fixtures and final wiring are complete.

- [ ] **Step 3: Complete fixture isolation and documentation**

Use a dedicated test database per run. Document install, environment setup, migration, seed, development, test, production build, admin bootstrap, backup, and participant data removal. State that production SQLite requires one persistent Node instance and a backed-up volume; PostgreSQL migration is recommended before horizontal scaling.

- [ ] **Step 4: Run the full verification suite**

```powershell
npm test
npm run typecheck
npm run lint
npm run build
npm run test:e2e
```

Expected: all commands exit 0.

- [ ] **Step 5: Inspect the rendered experience**

Render or open the event page, town at 360 px and 1024 px, worry detail, traveler profile, admin map editor, claim page, and my-traveler page. Fix clipping, inaccessible hotspots, unreadable text, accidental horizontal overflow, and reduced-motion violations.

- [ ] **Step 6: Commit**

```powershell
git add README.md package.json playwright.config.ts tests src public prisma
git commit -m "test: verify relief town MVP journeys"
```

## Final acceptance checkpoint

- [ ] Seed one event, ten worries, three to five featured worries, and six or more read-only life assets.
- [ ] Confirm 20 to 50 traveler records can be created and claimed without real personal data.
- [ ] Confirm a published viewpoint changes the associated life stage and hiding/deleting reverses it.
- [ ] Confirm public responses never include draft, hidden, deleted, authorization, token, password, or session fields.
- [ ] Confirm public visitors cannot create content or call admin/traveler mutation routes.
- [ ] Confirm no audio, transcription, AI viewpoint, comment, like, multiplayer, free-roam, asset upload, or payment feature entered the build.
- [ ] Confirm tests, typecheck, lint, production build, and end-to-end journeys all pass.
