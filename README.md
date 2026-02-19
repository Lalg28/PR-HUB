# PR Hub

Chrome extension that shows your open pull requests, review requests, and CI status — with GitHub Primer theming and auto dark mode.

## Features

- **My PRs tab** — See all your open pull requests with CI check status, comment count, approvals, and change requests
- **Reviews tab** — Pending reviews at the top, already-reviewed PRs at the bottom, with your review status badge
- **GitHub Primer theme** — Light and dark mode that follows your OS setting automatically
- **Skeleton loading** — Smooth loading placeholders instead of blank screens
- **Pagination** — Shows 10 PRs at a time with a "Show more" button
- **Profile link** — Click your avatar or username to open your GitHub profile

## Screenshots

| Light mode | Dark mode |
|---|---|
| _coming soon_ | _coming soon_ |

## Setup

### 1. Create a GitHub token

Go to [Settings > Developer settings > Personal access tokens > Tokens (classic)](https://github.com/settings/tokens) and generate a new token with these scopes:

- `repo`
- `read:user`

> **Note:** Only Classic PATs (starting with `ghp_`) are supported. Fine-grained tokens are not compatible.

### 2. Install the extension

```bash
# Clone the repo
git clone https://github.com/Lalg28/github-pr-check.git
cd github-pr-check

# Install dependencies
npm install

# Build
npm run build
```

Then load it in Chrome:

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked** and select the `dist/` folder

### 3. Login

Click the extension icon, paste your Classic PAT, and you're in.

## Development

```bash
# Watch mode (rebuilds on file changes)
npm run dev

# Production build
npm run build
```

After each build, go to `chrome://extensions` and click the reload button on the extension.

## Tech stack

- **React 19** + **TypeScript**
- **Vite** for bundling
- **CSS custom properties** with GitHub Primer color tokens
- **Chrome Extension Manifest V3**
- **GitHub REST API** (Search, Pulls, Reviews, Check Runs)

## Project structure

```
src/
  popup.tsx          # Entry point
  popup.css          # All styles (Primer tokens + dark mode)
  App.tsx            # Auth state management + data fetching
  github.ts          # GitHub API layer (search, enrich, reviews, checks)
  storage.ts         # Chrome storage wrapper
  components/
    LoginScreen.tsx  # Token input + validation
    Dashboard.tsx    # Header, tabs, review sections
    PRList.tsx       # PR items with pagination
icons/               # Extension icons (16, 48, 128px)
manifest.json        # Chrome extension manifest
```

## How it works

1. **My PRs** — Uses GitHub's Search API (`type:pr author:{user} is:open`), then enriches each PR with check status, review counts, and comment totals via parallel API calls
2. **Reviews** — Combines `review-requested:{user}` (pending) and `reviewed-by:{user}` (done) searches, filtered to the last 2 weeks, deduplicated, and enriched with your latest review state per PR

## License

MIT
