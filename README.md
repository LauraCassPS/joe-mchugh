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
Booking/form integration, approved testimonials and Friday Corner posts/link
remain unfinished. No tracking is included.

All pages retain noindex while unfinished. No production domain, canonical URL,
social image or privacy policy has been invented. Confirm those at launch, then
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
