# Runtime activation

Use the existing `ooza-m/Rufalfashion` repository and existing `rufalfashion` Vercel project in `ooza-s-projects`. Do not create another project.

1. Connect a PostgreSQL database through the project's Vercel Marketplace storage or an authorized Neon connection. Store its pooled, TLS-enabled URL in `DATABASE_URL`.
2. Provision Clerk for the administrative team. Enable email-code sign-in, create/invite the approved team accounts, and configure `CLERK_SECRET_KEY` and `CLERK_PUBLISHABLE_KEY` in the project. Never place real keys in Git.
3. Assign the approved owner and operations user IDs to `RUFAL_OWNER_USER_IDS` and `RUFAL_STAFF_USER_IDS`. These are server-only allowlists. Unknown signed-in users have no workspace permission. No first-user promotion is implemented.
4. Verify project/environment linkage and required variable names. Run `npm run db:migrate` only in the verified target with `RUFAL_MIGRATION_CONFIRMED=true`. The migration creates empty tables and inserts no business data.
5. Import/reconcile the private financial source through a protected workflow, retaining every original record. This import has not been implemented/run in this release. Do not upload the workbook to the public repository.
6. Add actual approved product photos, names, prices, sizes, quantities, known unit costs, and delivery zone fees. Unknown costs and unpriced zones remain null; they are not treated as zero or given invented defaults.
7. Confirm owner/staff sign-in, denial of staff finance/history access, product publication, order concurrency/idempotency, stock release, invoice amounts, verified payment transitions, central design publishing and contact inbox delivery against the connected services. Real-service verification is still pending.
8. Generate a server-only `RUFAL_RATE_SECRET` with at least 32 random characters. Enable `RUFAL_ORDERING_ENABLED=true` and `RUFAL_CONTACT_ENABLED=true` only after the relevant checks pass. Set `APP_URL` to the canonical origin.
9. Configure a native Vercel Cron for `/api/expire` using `CRON_SECRET` at a frequency supported by the approved hosting plan. Reads/new-order processing also expire overdue reservations atomically. Before sending a payment link, the pre-link reservation duration remains unspecified; no timeout is assumed. Link deadlines use the actual recorded sending time plus 48 hours.

Operational users may create a funding draft, but only owners may read funding history, approve drafts, write financial entries or publish the public design. Principal repayment and funding return are separate entry kinds; no unapproved post-repayment rates or staff distributions are automated.

Late payment confirmation returns a manual-review error instead of automatically restoring an expired order. A dedicated late-payment reconciliation workflow, full accounting reports and editable granular team administration are subsequent work.

## Current connection checkpoint

On 2026-10-12 an authorized Neon project `rufal-fashion` (`young-brook-36194446`) was created. Its `production` branch (`br-plain-star-arvm66by`), database `rufal`, contains the eleven empty foundation tables. No business records were imported. The production `DATABASE_URL` write to the existing Vercel project returned HTTP 403: production environment-variable permissions are missing. No credentials are stored in this repository. The deployed workspace therefore remains inactive until that setting, Clerk keys and approved owner IDs are configured. Ordering and contact intake remain disabled pending real-service checks.

## Catalog and financial detail release (v0.4)

`002-catalog-finance.sql` adds suppliers, categories, configurable code meanings, immutable base/variant codes, ordered photo galleries, arbitrary option combinations, sale schedules, actual cost components, inventory movements, settlements and idempotent admin operation receipts. Existing records are retained. Original spreadsheet codes must remain unchanged when a future private import is implemented; advance `product_number_seq` beyond the largest imported trailing product sequence before new creation. No original financial or product source data is seeded by this migration.

The migration was tested on `rufal-catalog-finance-v4` (`br-broad-math-arrqf25g`). SQL checks exercised stock protection and settlement arithmetic in rolled-back fixtures. A direct `pg` service integration attempt was blocked by the execution environment's DNS/network restriction; real order concurrency and authenticated owner/staff UI verification remain pending. `tests/live-orders.mjs` is ready for the dedicated test branch after network access is available and must not be run on production.

The public editor has 533 bilingual text keys, five Arabic font options, hero color-cycle controls, petal density and gentle flower motion. The product gallery uses native horizontal swipe with buttons and keyboard controls. Related products use style, category, length, sleeve, color and tags and show up to three actual matches. Reviews are deliberately reserved for a later verified-review workflow.
