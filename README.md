# Kantox Demo — FX Risk Dashboard

A dependency-free interactive concept app inspired by the workflow and visual language of modern FX risk-management platforms. This is a **concept demo only** and is not affiliated with or endorsed by Kantox.

## Features

- FX exposure KPIs and currency exposure chart
- Exposure-over-time chart with selectable ranges
- Simulated live FX-rate watchlist and refresh
- Create, copy, cancel and persist FX orders
- Add and persist recent transactions
- Search across orders and transactions
- Dismiss/clear alerts
- Editable currency-pair watchlist
- Responsive layout and lightweight module navigation
- Browser persistence using `localStorage`

## Run locally

No build step is required.

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080`.

## GitHub Pages deployment

This repo includes `.github/workflows/pages.yml` for deployment through GitHub Pages. For a newly created repository, GitHub requires Pages to be enabled with **Settings → Pages → Build and deployment → Source: GitHub Actions** before the custom workflow can deploy.

After Pages is enabled, every push to `main` deploys the site.

## Files

- `index.html` — dashboard markup and dialogs
- `styles.css` — responsive dashboard styles
- `app.js` — interactions and demo data
- `.github/workflows/pages.yml` — GitHub Pages deployment

## Notes

All rates, exposures, transactions and alerts are simulated and should not be used for trading or treasury decisions.
