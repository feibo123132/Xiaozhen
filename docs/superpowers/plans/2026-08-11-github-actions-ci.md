# GitHub Actions CI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a GitHub Actions workflow that verifies the Relief Town project whenever source changes reach GitHub.

**Architecture:** A single Ubuntu job checks out the repository, installs the pinned Node.js/npm dependency graph, generates Prisma Client, and runs the project's existing verification scripts. Deployment and GitHub Pages are deliberately excluded because the application requires a server runtime.

**Tech Stack:** GitHub Actions, Node.js 22, npm, Prisma, Vitest, TypeScript, ESLint, Next.js

---

### Task 1: Add and verify CI workflow

**Files:**
- Create: `.github/workflows/ci.yml`
- Create: `docs/superpowers/specs/2026-08-11-github-actions-ci-design.md`
- Create: `docs/superpowers/plans/2026-08-11-github-actions-ci.md`

- [ ] **Step 1: Verify the workflow is absent**

Run: `Test-Path -LiteralPath '.github/workflows/ci.yml'`
Expected: `False`.

- [ ] **Step 2: Add the minimal workflow**

Configure `push` on `main`, `pull_request`, and `workflow_dispatch`; use read-only contents permission, concurrency cancellation, Node.js 22.14.0, `npm ci`, Prisma generation, unit tests, type checking, lint, and production build.

- [ ] **Step 3: Validate the workflow and repository**

Run the YAML structure check, `npm test`, `npm run typecheck`, `npm run lint`, and `npm run build`.
Expected: all commands exit successfully.

- [ ] **Step 4: Review the final diff**

Run: `git diff --check` and `git status --short`.
Expected: no whitespace errors; only the CI workflow and its design/plan documents are uncommitted.
