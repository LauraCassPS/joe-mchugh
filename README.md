# Joe McHugh Coaching

Current static Home, About, One-to-One and Team Coaching pages.

- Home: `index.html`
- About: `about/index.html`
- Home styles, scripts and shared assets: `homepage/`
- About-specific assets and styles: `about/`

## Preview

Run `python3 -m http.server 8000 --bind 127.0.0.1` from this folder and open
http://127.0.0.1:8000/. The pages also work as ordinary static files.

## Editing

Edit the HTML and the readable CSS source files. After CSS edits, run `npm ci`
once, then `npm run build:css` to regenerate both `site.min.css` files. Node is
only needed for development; hosting needs no build command. Run `npm run check`
to check links, responsive assets and draft-state invariants.

## Draft state

The design, palette and approved copy are retained. All four pages are connected through the shared navigation.
The shared contact forms submit to Formspree. Friday Corner displays the SociableKIT LinkedIn widget, with its free-plan credit. Calendar booking and homepage testimonials remain unfinished. Form delivery still needs an end-to-end inbox check.

All pages retain noindex while unfinished. No production domain, canonical URL,
social image has been invented. Confirm those at launch, then
add the final sitemap/robots policy and remove noindex. Noindex is not privacy
or access control. The repository and any configured deployment retain their
existing access settings.

Hosting can serve the repository root directly. GitHub Pages, if chosen, can
publish `main` from `/ (root)` without a Node build. Existing external hosting
can likewise use the root and the committed CSS output.

Original photographs, unused exports, local audit screenshots, internal notes
and design archives are not included. The old wireframe is recoverable from
Git history. Automated accessibility checks passed at desktop/mobile widths;
manual photo-contrast, zoom and assistive-technology review remain launch checks.

Team Coaching: `team-coaching/index.html`. Includes the approved compact diagram, voice divider and paired pro bono / Irish saying layout.

Team Coaching review update, 16 November 2026: office hero photograph, softer photo treatments, compact working section and outdoor retreat section with a pending-permission photo placeholder. Six FAQs are present with the updated client-supplied answers for confidentiality, participation and workshop timing. Calendar integration remains pending; the shared contact form is connected to Formspree.

Code of Ethics: `code-of-ethics/index.html`. Includes the December 2025 PDF hosted with the site and same-tab footer links. Statement remains draft pending Joe’s confirmation of practice and complaints arrangements.

Privacy and Cookie Policies: `privacy-policy/index.html` and `cookie-policy/index.html`. Supplied copy dated 18 November 2026, using the Code of Ethics layout. All three footer policy links open in the same tab.
