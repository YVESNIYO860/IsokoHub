# Claude Code project guide

## Project overview

IsokoHub is a React and Vite marketplace. The interface uses React components in `src/`, shared styles in `css/style.css` and `css/site-refinements.css`, and existing page logic in browser scripts under `js/`. Supabase is used for authentication and data services.

## Working in this repository

- Follow the existing component, script-loading, and CSS conventions; inspect nearby code before changing a shared surface.
- Register React routes and route metadata in `src/main.jsx`. Vite generates clean route directories and legacy `.html` entry points during a production build.
- Use root-absolute paths for shared CSS, scripts, and assets so they keep working from clean nested routes such as `/login/`.
- Prefer shared design tokens and `css/site-refinements.css` for site-wide visual consistency. Keep page-specific styles scoped to their page.
- Keep current IsokoHub brand colors and ensure changes work on narrow screens, keyboard navigation, and reduced-motion preferences.
- Preserve the existing Supabase integration. Never commit credentials, private keys, or local environment files.
- Do not commit or push changes unless the user explicitly asks.

## Validation

- Run `npm run build` after UI, routing, or bundling changes.
- Run focused tests with `node --test tests/<test-file>.test.js`; run the suite with `node --test tests/*.test.js`.
- The package's `npm test` script is a placeholder and intentionally exits with an error.
