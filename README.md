# Joe McHugh website

- **Current website:** [Homepage](homepage/index.html) , [About Joe](about/index.html) , [One-to-One](one-to-one/index.html) and [Team Coaching](team-coaching/index.html).
- **Photos:** `photography/`; homepage originals are in `photography/Home photos `.
- **Earlier designs:** [Design archive](Design%20archive/) contains all earlier studies, wireframes and newspaper layouts. These are retained for reference.
- **Brand:** the brand board and brand overview remain in this folder.
- **Shared assets:** `assets/` supports archived designs; `homepage/assets/` supports the current website. Keep both.
- **Reference:** `reference/` contains historical notes, previews and recovery ZIPs.
- **Scripts:** `scripts/preview-site.py` previews the current site; `scripts/validate-about.py` checks it against the retained About wireframe in Design archive.

To browse all designs locally, run `python3 -m http.server 8765` from this folder, then visit http://localhost:8765/. The dedicated preview script serves only the current website.

Archived on 9 November 2026. No design work was deleted. Original edited files and the move list are saved in `reference/design-archive-recovery-2026-11-09.zip`.

One-to-One now has a separate production candidate. The approved wireframe and colour study remain in `one-to-one-wireframe/`. See [production checks and launch requirements](one-to-one/README.md). Build styles with `npm run build:css`; validate all three pages with `npm run check`.

Team Coaching is built from the approved colour preview. See `team-coaching/README.md` and `audits/team-coaching-build-20261114.md`. Run `npm run check:team` for its scoped checks.

Book is now an integrated candidate at [Book](book/index.html), with connected navigation and a separate Delivery & Returns page. See [combined build review](audits/book-integration-20261120.md). Run `npm run check:book`. Checkout and final content remain pending; nothing published.

## Newsletter and contact update — 23 November 2026

Centred headers include equal-width newsletter and booking actions. Every existing page has the painted Kit newsletter panel above the footer. Four contact forms include an optional, unticked newsletter checkbox; only the email address is sent to Kit after a successful enquiry. Enquiry and signup failures are reported separately. The send button sits beside the opt-in where space permits. Public contact details use joe@socoaching.ie, including Privacy, Cookie, Ethics and Delivery & Returns pages.

Run `node --test scripts/test-contact.cjs` and `node scripts/test-contact-newsletter.cjs` for mocked submission checks. Live inbox delivery, Kit sender authentication/confirmation settings, and Kit cookie-consent behaviour remain to be verified. Existing book extract and checkout placeholders and noindex remain unchanged.
