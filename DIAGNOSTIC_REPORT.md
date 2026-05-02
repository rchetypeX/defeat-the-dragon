# Defeat the Dragon Diagnostic Report

Date: 2026-05-02

Scope: original read-only diagnostic of repository status, likely jump-off point, breakage risks, security issues, and next steps.

## Remediation Update

After this diagnostic was written, the safe fixes that did not require owner-specific intervention were applied:

- Added ignore rules and removed tracked local secrets/generated outputs from git.
- Removed forced mock bearer tokens and mock session/reward fallbacks from the production session flow.
- Made session completion calculate rewardable duration from server-side session start time instead of trusting the client-provided duration.
- Replaced the public email-existence checker with a generic response and removed client-side pre-signup account enumeration.
- Added a minimal ESLint config and changed Vitest scripts to one-shot mode so lint/test gates complete.
- Removed the vulnerable Workbox build-time plugin and applied nonbreaking audit updates, reducing production audit findings from 17 to 2.

Remaining items that still need owner/platform decisions are listed near the end of this report.

## Executive Summary

The app can currently typecheck and produce a production build, but it is not merge-ready or launch-safe.

The most urgent issues are exposed tracked secrets, tracked generated build/cache artifacts, missing public assets referenced by the app and PWA manifest, vulnerable production dependencies, and development mock authentication paths that can bypass real Supabase-backed session behavior. The branch has also diverged from `origin/main`, and the latest local commit appears to be a recovery/checkpoint commit that added generated files and sensitive env files.

## Repo Status

- Current branch: `main`
- Remote relation: `main...origin/main [ahead 6, behind 12]`
- Working tree before writing this report: clean, with no untracked files reported
- Latest local commit: `c769a0c` at `Sat May 2 10:16:44 2026`, message `Last Commit 8 months ago`
- Local-only recent commits include the same session names as remote commits but with different hashes, plus the latest checkpoint commit. This suggests history divergence rather than a simple fast-forward.
- `origin/main` contains several later asset-related commits from Aug 24, 2025 that are not in local `main`.

## Last Jump-Off Point

The clearest jump-off point is commit `c769a0c`:

- Commit date: `Sat May 2 10:16:44 2026`
- Commit message: `Last Commit 8 months ago`
- Notable added files:
  - `apps/web/.env`
  - `apps/web/.next/package.json`
  - `apps/web/.next/routes-manifest.json`
  - `apps/web/alpha_codes.csv`
  - `apps/web/alpha_codes_for_testing.txt`
  - `apps/web/alpha_codes_simple.txt`
  - several `.turbo/daemon/*.log.*` files

That commit looks like a local checkpoint after returning to the repo, not a clean product feature commit. It added secrets and generated artifacts, so treat it as a recovery point that needs cleanup before pushing or merging.

## Verification Results

- `npm run typecheck`: passed for `@defeat-the-dragon/engine`, `@defeat-the-dragon/ui-tokens`, and `@defeat-the-dragon/web`.
- `npm run build`: passed. Next.js built 9 app routes successfully.
- `npm test`: failed. `@defeat-the-dragon/web` has no matching test files, so Vitest exits with code 1.
- `npm run lint`: failed. `@defeat-the-dragon/engine` runs ESLint but no ESLint config exists.
- `npm audit --omit=dev`: failed with 17 vulnerabilities: 1 low, 4 moderate, 12 high.
- IDE lints: no diagnostics were reported by Cursor for `apps/web`, `packages/engine`, or `packages/ui-tokens`.

## Critical Findings

### 1. Tracked Secrets And Env Files

`apps/web/.env` and `apps/web/.env.local` are tracked by git. The checked `.env` contains real-looking Supabase keys, a Supabase service role key, VAPID private key material, Farcaster manifest material, and public wallet/API configuration.

Why it matters:

- A Supabase service role key bypasses Row Level Security and must never be committed.
- VAPID private keys and Farcaster signatures should be treated as secrets.
- The production build logs confirm Next is loading `.env.local` and `.env`.

Recommended next steps:

- Rotate the Supabase service role key, VAPID keypair, and any other exposed secret values.
- Remove committed env files from git history or, at minimum, from the current branch.
- Replace committed env files with a sanitized example file.
- Expand `.gitignore` beyond `node_modules` to include `.env*`, `.next`, `.turbo`, logs, and local-only generated files.

### 2. Generated Artifacts Are Tracked

Git tracks `.turbo` cookies/logs and `apps/web/.next` files. The latest local commit added several of these artifacts.

Why it matters:

- Build artifacts can embed environment-derived values.
- Cache/cookie/log artifacts create noisy commits and can leak local runtime data.
- `.next` should be generated during build, not versioned.

Recommended next steps:

- Stop tracking `.turbo` and `.next`.
- Clean the latest checkpoint commit or make a cleanup commit before any PR.
- Review `apps/web/alpha_codes*.txt/csv` to decide whether these are secrets, test-only data, or intended fixtures.

### 3. Missing Public Assets Will Break The App Experience

The app references many public files that are absent locally:

- `/icons/icon-*.png`
- `/icons/shortcut-focus.png`
- `/icons/shortcut-adventure.png`
- `/screenshots/mobile-home.png`
- `/screenshots/desktop-session.png`
- `/assets/images/forest-background.png`
- `/assets/audio/background-music.mp3`
- `/assets/audio/focus-session-music.mp3`
- many `/assets/ui/*.png` and `/assets/icons/*.png`

Only a small subset of `public/assets` exists locally. The build passes because these are runtime/static path references, but the PWA manifest and UI will show broken images/audio in the mini-app.

Recommended next steps:

- Reconcile local `main` with the remote asset commits on `origin/main`.
- Add a static asset existence check for manifest and hardcoded asset paths.
- Confirm whether the app is intended to ship as a PWA only or also as a Farcaster/Base mini-app.

### 4. Mock Authentication Is Still Active In Core Session Flow

`apps/web/lib/api.ts` always returns `mock-token-for-development` for API requests. The server routes for starting and completing sessions explicitly accept that token and then use mock user/session/player data.

Why it matters:

- Authenticated users can appear to play without writing real Supabase session state.
- Rewards can be simulated client-side after API failure.
- Production behavior will not match the actual database-backed flow.

Recommended next steps:

- Replace the forced mock token with the real Supabase access token.
- Gate mock mode behind a non-production environment flag.
- Make API failures visible to the UI instead of silently awarding mock rewards.
- Add integration tests for start/complete session with real auth token handling.

### 5. Email Enumeration And Service Role Usage In Public Route

`/api/auth/check-email` accepts arbitrary email addresses and reports whether an account exists. It uses the service role key to list all users, then falls back to dummy-password sign-in checks.

Why it matters:

- The endpoint enables account enumeration.
- Listing all auth users for every check is inefficient and risky.
- Request logging includes submitted emails.

Recommended next steps:

- Remove pre-signup email existence checks or return a generic response.
- Do not use service role auth admin APIs in a public unauthenticated endpoint.
- Add rate limiting and avoid logging email addresses.

### 6. Dependency Vulnerabilities

`npm audit --omit=dev` reports high-severity issues in production dependency paths including `next`, `lodash`, `minimatch`, `picomatch`, `rollup`, `serialize-javascript`, `webpack`, and related transitive packages.

Why it matters:

- The Next.js advisories include multiple denial-of-service and request handling issues.
- The app is a network-exposed Next.js app with API routes.

Recommended next steps:

- Upgrade Next.js and related dependencies using `npm audit fix` or targeted package updates.
- Re-run build, typecheck, tests, and audit after dependency updates.
- Review whether Workbox is still needed, because several audit paths come through PWA/build tooling.

## High-Priority Bugs And Reliability Risks

### Test And Lint Pipelines Are Not Valid Gates

- `npm test` fails because the web workspace has no tests.
- `npm run lint` fails because ESLint config is missing.

Recommended next steps:

- Add a minimal web test or configure Vitest to `--passWithNoTests` until real tests exist.
- Add shared ESLint config or adjust package lint scripts.

### Session Completion Trusts Client-Reported Duration

`/api/sessions/complete` uses `actual_duration_minutes` from the client for rewards. It fetches the session start time but does not derive or clamp the rewarded duration from server time.

Recommended next steps:

- Compute duration server-side from `session.started_at`.
- Enforce minimum/maximum duration and expected end time.
- Store and verify a session nonce if it is intended to prevent replay/tampering.

### Soft Shield Can Be Bypassed Or Miscount Disturbance

Soft Shield is entirely client-side and resets total away time when the user returns. Server completion accepts the client-provided outcome and disturbed seconds.

Recommended next steps:

- Treat Soft Shield as UX only unless server-side verification is added.
- Persist session start and expected end server-side and validate completion timing.
- Avoid awarding success solely based on client-provided `outcome`.

### Signup Debounce Cleanup Does Not Work As Intended

`SignUpForm` creates a timeout inside `handleEmailChange` and returns a cleanup function from an event handler. React ignores that return value, so older email checks can race newer input.

Recommended next steps:

- Move debounce logic into `useEffect` keyed by `email`.
- Track request IDs or abort previous checks.

### Farcaster/Mini-App Integration Appears Incomplete

The env file contains Farcaster hosted manifest values and onchain-related public settings, but source search did not find corresponding mini-app implementation code. The public `manifest.json` is a normal PWA manifest, not a Farcaster mini-app manifest.

Recommended next steps:

- Decide whether the target is PWA, Farcaster mini-app, or both.
- Add the required mini-app manifest route/configuration if launching inside Farcaster.
- Add validation for hosted manifest metadata and image URLs.

## Suggested Recovery Plan

1. Secure the repo first:
   - Rotate exposed secrets.
   - Remove tracked `.env`, `.env.local`, `.next`, `.turbo`, and other local/generated artifacts.
   - Expand `.gitignore`.

2. Reconcile history:
   - Compare local `main` to `origin/main`.
   - Bring in the remote asset commits or otherwise restore required public assets.
   - Avoid pushing the current checkpoint commit as-is.

3. Stabilize launch behavior:
   - Remove production mock auth/session paths.
   - Server-validate focus-session duration, outcome, and rewards.
   - Make session API failures visible instead of silently awarding mock rewards.

4. Repair project gates:
   - Fix ESLint configuration.
   - Add minimal tests for auth, session start, session completion, and reward calculation.
   - Re-run `npm run typecheck`, `npm run build`, `npm run lint`, `npm test`, and `npm audit --omit=dev`.

5. Confirm mini-app readiness:
   - Restore all assets referenced by `page.tsx`, dashboard components, and `manifest.json`.
   - Add mini-app manifest support if Farcaster is in scope.
   - Test install/open behavior on the target mini-app platform, not only in a browser.

## Current Confidence

- Build viability: medium. The production build passes, but runtime assets and security posture are not ready.
- Security readiness: low. Secrets are tracked and mock auth/session paths are active.
- Mini-app readiness: low to medium. The PWA shell builds, but the mini-app-specific integration is not evident and required assets are missing locally.
- Best next move: do a security cleanup and branch reconciliation before implementing new features.
