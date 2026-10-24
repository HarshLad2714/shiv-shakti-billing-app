# Shiv Shakti POS

Billing desk for **Shiv Shakti Fast Food**. Tap a menu item, the bill updates immediately, then save, print, or share it.

The app is a React + Vite progressive web app. Bills, the menu, and shop settings stay in this browser, so the counter keeps working without internet after the first load.

## Use it

```bash
npm install
npm run dev
```

Open the local URL Vite prints. The billing screen is the home page.

- Tap a card to add 1 kg, 1 litre, or 1 piece.
- On weight and drink cards, tap **250g / 500g / 1kg** or **200ml / 500ml / 1L**.
- Use **+ / −** or type a quantity such as `0.5` on the bill.
- Choose Cash, UPI, or Card. For cash, enter the amount received to see the change.
- **Save & print** stores the bill and opens the browser print dialog (58mm / 80mm or A4).
- **History** can reprint or share a past bill on WhatsApp.
- **Reports** shows the day’s sales and exports CSV.
- **Admin** PIN is `1234` until you change it. Add prices, hide items, or mark them out of stock there.

French fries, nuggets, and cheese balls are in Admin already, hidden, with no price. Set a price and show them when you are ready to sell them.

## Checks

```bash
npm test
npm run build
```

## Deploy on Netlify

`netlify.toml` builds with `npm run build` and publishes `dist`. Client-side routes fall back to `index.html`.

### Option A — Netlify connects to GitHub

1. Push this repo to GitHub.
2. In Netlify: **Add new site → Import an existing project**.
3. Pick this repository. Build command and publish directory come from `netlify.toml`.
4. Leave the GitHub secrets below empty. The GitHub Action still runs tests and a production build on every push and pull request.

### Option B — GitHub Actions deploys to Netlify

1. In Netlify, create a site and copy the **Site ID** (Site configuration → Site details).
2. Create a personal access token: User settings → Applications → Personal access tokens.
3. In GitHub: **Settings → Secrets and variables → Actions**, add:
   - `NETLIFY_AUTH_TOKEN`
   - `NETLIFY_SITE_ID`
4. Push to `main`. `.github/workflows/ci.yml` tests, builds, and deploys.

Use one option. If both Netlify’s Git connection and the Action secrets are active, production will deploy twice.

## Data

Everything lives in `localStorage` on the device. Download a JSON backup from Admin before clearing the browser. The backup includes the admin PIN.
