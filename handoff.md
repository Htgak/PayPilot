# PayPilot UI and authentication handoff

## User request in progress

The latest request was interrupted after asking to:

- Make the UI more correct and add working global search.
- Add page navigation and sidebar collapse/expand controls.
- Redesign the AI side chat panel to visibly match its reference.
- Add email/password login.
- Improve the dark theme colors.

The previous finished work in this same thread also includes dashboard, profile settings, full assistant-page, and theme-toggle redesigns based on the provided references. Preserve those edits unless deliberately changing them.

## Work already started for the latest request

- Added `AuthUserModel` in `apps/api/db/models.py` and included it in DB initialization in `apps/api/db/database.py`.
- Added `apps/api/api/auth.py` with password hashing (PBKDF2), one-time first-owner signup, email/password login, a signed 12-hour bearer token, and auth-status endpoint.
- Added API middleware in `apps/api/main.py` requiring a valid bearer token for `/api/*` except auth endpoints, health, and PayPal webhook paths. CORS wildcard was removed in favor of the configured local origins.
- Changed the development JWT fallback in `apps/api/config.py`.
- Added API client auth calls and bearer-header injection in `apps/web/lib/api.ts`.
- Added `apps/web/components/AuthProvider.tsx` and mounted it from `apps/web/app/layout.tsx`; it redirects unauthenticated routes to `/login` and stores the session token/email in localStorage.
- Added `apps/web/app/login/page.tsx` with first-owner setup or regular sign-in depending on `/auth/status`.

These edits have **not been built or runtime-tested** after they were added.

## Still to do

1. Finish global search in `apps/web/components/Navbar.tsx`: searchable invoice/payment records, useful route suggestions, keyboard access, and navigation to selected results. Update invoice/transaction pages to apply a `search` query parameter if needed.
2. Add functional desktop sidebar collapse/expand and mobile page navigation. Current `Sidebar.tsx` has routes but no collapse control and is hidden on mobile.
3. Redesign `ChatDrawer.tsx` itself. It still has the older prompt list, message layout, and composer; the user explicitly said the side chat had not changed enough.
4. Update dark surfaces across shared components and app pages to a consistent softer navy/graphite palette. Current dark page classes still vary widely.
5. Build and fix all TypeScript/API import/runtime issues. Then check the login, dashboard, search, navigation, sidebar, and drawer in the running app.

## Important implementation constraints / risks

- Existing business records and API handlers use the single tenant ID `default_merchant`. The new first-owner account authenticates access to that shared workspace; it does not create isolated tenant data.
- Signup is intentionally allowed only while the `auth_users` table is empty. Subsequent account creation returns 403.
- The new authentication middleware protects API routes, but inspect compatibility with direct links such as invoice PDF URLs, which currently do not attach bearer headers.
- Verify auth token expiry behavior in the frontend. `AuthProvider` currently gates routes based on token presence, not token validity; expired tokens may need a clear redirect on 401.
- Use the current user changes already in the worktree. Many files were modified before this request; do not revert or overwrite unrelated edits.

## Current verification status

- No checks have been run for the latest auth changes.
- A previous production build had passed before the latest auth work and before the current request was interrupted; it does not verify the new auth changes.
- The existing development server may or may not still be running. Check before starting another Next process, since concurrent dev/build processes previously caused `.next` cache collisions.
