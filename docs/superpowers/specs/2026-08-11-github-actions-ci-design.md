# GitHub Actions CI Design

## Goal

Push the Relief Town source to `feibo123132/Xiaozhen` and automatically verify every push to `main` and every pull request with GitHub Actions.

## Scope

- Add one least-privilege CI workflow.
- Use the project's supported Node.js 22 runtime and npm lockfile.
- Generate the Prisma client before verification.
- Run unit tests, type checking, linting, and the production build.
- Allow manual runs from the GitHub Actions tab.
- Do not configure GitHub Pages or application deployment.

## Rationale

The application uses Next.js server features, API routes, authentication, and SQLite. GitHub Pages only serves static artifacts, so it cannot run the complete application without a major redesign. Hosting remains a separate future task for a Node.js-capable platform.

## Acceptance Criteria

- `.github/workflows/ci.yml` is valid YAML and references existing npm scripts.
- The workflow runs on pushes to `main`, pull requests, and manual dispatch.
- The job has read-only repository permissions and cancels superseded runs.
- Existing local tests, type checking, linting, and production build still pass.
