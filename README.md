# Rufal Fashion

Arabic/English storefront and project workspace, with coordinated generated artwork and transparent PNG branding.

## Current release

- Homepage, collection, dress detail, cart, checkout, order tracking and contact interfaces.
- `design.html`: bilingual text editing, image/PNG logo upload/removal, layout settings, local drafts, import/export, and owner-only central publishing when connected.
- `workspace.html`: operational overview, orders, products/stock, delivery areas, finance, funding drafts, team access and design navigation.
- `signin.html`: official Clerk SDK email-code sign-in with optional TOTP verification. Roles are granted server-side to explicit user IDs; signing in alone does not grant access.
- Node API routes and PostgreSQL schema for records, atomic inventory reservations, idempotent order creation, payment-link timing, manual payment confirmation, stock release, and audit history.

## Activation status

This release is an initial implementation, not a fully activated store. Database/auth environment configuration could not be accessed through the current Vercel connection (403). No database migration or live-data import was run. API routes fail closed until configured, and order/contact intake have separate default-off activation flags.

Follow [activation.md](docs/activation.md). The historical financial workbook, operating document, customer data and credentials are excluded from this public repository.

## Build and validation

```sh
npm ci
npm test
npm run build
```

The static build only copies public pages, client scripts, CSS, content and artwork into `dist`. Server code, SQL, tests, dependencies and environment files are excluded.

Six tests cover role isolation, money precision/missing costs, order transitions, distribution reconciliation and unconfigured endpoint guards. Syntax, bilingual content references, asset integrity and transparency were checked. Browser visual QA and real account/database end-to-end checks remain pending.

## Design drafts

`content.json` is the deployment's default design. Drafts use IndexedDB on the current browser/device. `?published=1` ignores a local draft. Central publishing additionally requires a signed-in owner and a connected database. Product/customer/financial records are not stored in browser drafts.
