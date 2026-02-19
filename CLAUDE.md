# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What is this?

PR Hub is a Chrome Extension (Manifest V3) that shows a user's open GitHub pull requests, pending review requests, and CI status in a popup. It uses GitHub's REST API with a Classic Personal Access Token (`ghp_`). Styled with GitHub Primer design tokens and supports auto light/dark mode via `prefers-color-scheme`.

## Commands

- `npm run build` — production build to `dist/`
- `npm run dev` — watch mode (rebuilds on change)
- No test runner or linter is configured.

After building, load `dist/` as an unpacked extension in `chrome://extensions`.

## Architecture

**Entry point:** `popup.html` → `src/popup.tsx` → `<App />`

**Data flow:** App.tsx holds all top-level state (token, user, PRs). On login or reload, it calls `fetchAllPRs()` which runs three parallel GitHub Search API queries (authored, review-requested, reviewed-by), deduplicates review PRs, then enriches each PR with details (comments, check status, approvals) via parallel API calls.

**Key modules:**
- `src/github.ts` — All GitHub API interaction. Search, enrichment (PR details + reviews + commit status + check-runs), and review status detection. Re-exports types from `types.ts`.
- `src/storage.ts` — Thin wrapper around `chrome.storage.local` for PAT persistence. Falls back to no-op when chrome.storage is unavailable.
- `src/types.ts` — Shared TypeScript interfaces (`PullRequestItem`, `GitHubUser`, `CheckStatus`, `ReviewStatus`).

**Components:**
- `LoginScreen` — PAT input with `ghp_` prefix validation and scope badges.
- `Dashboard` — Header (profile link, reload, logout) + tab bar ("My PRs" / "Reviews") + scrollable PR list. Reviews tab splits into "Pending review" and "Reviewed" sections.
- `PRList` — Reusable paginated list (10 per page). Conditionally renders check badges, author info, comment/approval counts, and review status based on props.
- `Skeleton` — Loading placeholders (`DashboardSkeleton` for initial load, `PRListSkeleton` for reload).

**Styling:** Single `src/popup.css` file using CSS custom properties for Primer color tokens. `:root` defines light mode, `@media (prefers-color-scheme: dark)` overrides for dark mode. All components use class names (no inline styles, no CSS-in-JS).

**Build:** Vite with a custom plugin that copies `manifest.json` and `icons/*.png` into `dist/` after bundling.

## Code principles

Follow DRY (Don't Repeat Yourself) and ETC (Easy To Change) principles in all changes.

## GitHub API constraints

- Only Classic PATs (`ghp_`) work — fine-grained tokens don't support the Search Issues API.
- Required scopes: `repo`, `read:user`.
- Review-requested PRs disappear from `review-requested:` query after reviewing, so a separate `reviewed-by:` query is merged in with deduplication.
- Review queries are filtered to the last 2 weeks to limit results.
