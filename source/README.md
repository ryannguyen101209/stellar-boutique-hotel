# Source for index.html

`../index.html` is a single self-contained bundle (React + Tailwind, built with Parcel and html-inline).
This folder holds the editable source: `src/App.tsx` (layout), `src/copy.ts` (all Vietnamese/English text,
including the [placeholders] for room names, prices and photos), `src/index.css` (design) and
`src/assets.ts` (the supplied photos, base64).

To rebuild, create a Vite + React + Tailwind project, drop these files in, and bundle to one HTML file.
Keep the Google Fonts `<link>` tags out of the bundler's way and re-insert them afterwards.
