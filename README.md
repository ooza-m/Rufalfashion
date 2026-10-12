# Rufal Fashion

Arabic/English responsive visual prototype of the Rufal storefront.

## Pages

- `index.html`: approved homepage, generated garden artwork and layered transparent flowers.
- `collection.html`, `product.html`, `checkout.html`, `contact.html`: mobile-first interface previews.
- `design.html`: edit the complete bilingual content catalog, upload/remove PNG logos, replace artwork, adjust colors/logo sizes and floral/petal settings, and preview pages live.
- `gallery.html`: coordinated artwork for all planned page families plus UI reference designs.

## Design persistence

`content.json` is the published design. The editor saves drafts in IndexedDB on the current browser/device. It can export/import `rufal-design.json`. An exported configuration can replace `content.json` in a reviewed deployment. Editor changes are not remotely published, and administrator authentication is not active yet. `?published=1` loads the published content without a local draft.

PNG alpha is preserved. Logo images use `object-fit: contain` and are never clipped. Uploaded images are validated; SVG uploads are not accepted. Imported settings are restricted to the known schema. Form submission, product purchasing, payments and message delivery are inactive in these previews.

Customer records, financial workbooks and private operating documentation are excluded from this public repository.

## Verification

JavaScript syntax, bilingual key coverage, local asset references, alpha channels, content editing and import sanitization were checked. Browser visual QA was unavailable in the execution environment.
