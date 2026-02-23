# PWA (Progressive Web App) setup and deployment

## Why the URL bar install icon doesn’t show

Browsers only show the install option in the address bar when the app is **installable**. The usual cause here is that the **service worker never registers** because the server returns the wrong content for `/sw.js`.

**Quick check (production):** When the site is served from a **built deploy** (not the dev server), open **`https://YOUR-URL/sw.js`** in a new tab. You must see **JavaScript** (e.g. `importScripts`, `workbox`), not “phasepoint-frontend” or HTML. If you see the wrong content, the deploy isn’t serving the real `sw.js` (see “Deployment: serve PWA assets as real files” below).  
**In dev** (Cloudflare tunnel → Vite), the SW is at **`/dev-sw.js?dev-sw`**—use that URL to verify the dev server is serving the SW correctly (see “Dev with Cloudflare tunnel” below).

## Dev with Cloudflare tunnel (current setup)

The app is currently served in dev via **Cloudflare tunnel → `make start-dev`** (Vite dev server). So when you open e.g. `https://phasepoint.dcorps.dev`, the origin is your local Vite dev server.

- **Service worker in dev**: Vite serves the SW at **`/dev-sw.js?dev-sw`** (not `/sw.js`). The app’s `registerSW()` registers this URL. So in dev, the install icon depends on this URL returning real JavaScript.
- **Quick dev check**: With the tunnel and dev server running, open **`https://phasepoint.dcorps.dev/dev-sw.js?dev-sw`** in a new tab. You should see **JavaScript** (e.g. `workbox`, `importScripts`). If you see “phasepoint-frontend” or HTML, the tunnel or dev server isn’t serving the dev SW correctly.
- **Manifest and icons**: Same URL base; Vite serves `/manifest.webmanifest` and `/icon-192.png`, `/icon-512.png` from the plugin and `public/`. The tunnel must forward these paths to Vite (no rewriting).
- **Production later**: When you deploy the built app (e.g. `dist/` to Cloudflare Pages or another host), that server will use **`/sw.js`** (and `workbox-*.js`). The “Why the URL bar install icon doesn’t show” check above applies to that production URL.

## What’s in place

- **vite-plugin-pwa** in `vite.config.ts`: generates `manifest.webmanifest`, service worker, and workbox runtime.
- **Service worker URL**: In **dev** (with `devOptions.enabled: true`) the SW is at `/dev-sw.js?dev-sw`. In **production** build it is `/sw.js`.
- **Icons**: `public/icon-192.png` and `public/icon-512.png` (used in the manifest).
- **Registration**: `src/main.ts` calls `registerSW({ immediate: true })` so the service worker is registered when the app loads.
- **Manifest link**: `index.html` includes `<link rel="manifest" href="/manifest.webmanifest" />`.

## Why “Install” might not appear

Browsers only offer “Install” / “Add to Home Screen” when:

1. The page is in a **secure context** (HTTPS or localhost).
2. A **manifest** is linked and valid (name, icons, etc.).
3. A **service worker** is registered successfully.

If the service worker script is not served correctly, registration fails and the app is not installable.

## Deployment: serve PWA assets as real files

When you deploy the built app (e.g. `dist/`), the host must serve these URLs as **actual files**, not as the SPA fallback (e.g. not as `index.html`):

- `/sw.js`
- `/workbox-*.js` (e.g. `workbox-8c29f6e4.js`)
- `/manifest.webmanifest`
- `/icon-192.png`, `/icon-512.png`

If your host is configured with a “single-page app” rule that serves `index.html` for every path, then a request to `/sw.js` may get HTML instead of the service worker script. The browser will then fail to register the service worker and the app will not be installable.

### What to do

1. **Check in the browser**  
   Open DevTools → Network, reload the app, and find the service worker request: **dev** → `dev-sw.js?dev-sw`; **production** → `sw.js`.  
   - It should return **200** with **Content-Type** `application/javascript` (or similar) and the response body should be JavaScript.  
   - If the response is HTML or a small string like “phasepoint-frontend”, the server is sending the SPA instead of the real `sw.js`.

2. **Deploy the full build output**  
   Run `npm run build` and deploy the **entire** `dist/` folder. The build must include at the root of the deployed site: `sw.js`, `manifest.webmanifest`, `icon-192.png`, `icon-512.png`, and `workbox-*.js`. Run `npm run build:verify` after building to confirm these files exist before you deploy.

3. **Adjust the host config**  
   Configure your host so that the paths above are served from the built files and are **excluded** from any “catch-all → index.html” (SPA fallback) rule.

   Examples:

   - **Cloudflare Pages**: Deploy with “Build output directory” = `dist`. By default, Pages serves files that exist; the SPA fallback (index.html for missing routes) only applies when a file is missing. So if your deploy includes `sw.js` etc. in the root, they should be served. If you added a custom “Single-page app” or `_redirects` that sends everything to index.html, remove it or add exceptions for `/sw.js`, `/manifest.webmanifest`, `/icon-192.png`, `/icon-512.png`, and `/workbox-*.js`.
   - **Nginx**: Use `try_files $uri $uri/ /index.html;` so that existing files (e.g. `sw.js`) are served first, then index.html for app routes.
   - **Vercel / Netlify**: Ensure the listed paths are served as static assets, not through the SPA redirect.

4. **Dev server vs production**  
   With `make start-dev`, the Vite dev server serves the service worker and manifest correctly. If you’re testing install via a **tunnel to the dev server**, it should work as long as the tunnel forwards requests to Vite.  
   If you’re testing install on a **deployed** URL (e.g. phasepoint.dcorps.dev backed by a static deployment), then the host must serve `sw.js` and the other PWA assets as described above.

## How to install (browser UI only)

Install is done via the browser’s built-in PWA install flow—no custom buttons in the app.

- **Chrome / Edge**: After the app is installable, look for the install icon in the address bar (⊕ or “Install” / “App available”). You can also use DevTools → Application → Manifest and click “Install” if shown. Chrome may require ~30 seconds on the page and one click before showing install.
- **Firefox**: Install appears in the **address bar** (install/house icon) or in the **browser menu** (≡ → “Install” or “Install Site as App”) when the app meets Firefox’s criteria. The manifest must include 192×192 and 512×512 PNG icons (already configured). If Install never appears, check DevTools → Storage (or Application) → Manifest for errors.

## Verifying installability

- **Chrome**: DevTools → Application → Manifest. Look for installability messages or an “Install” button.
- **Firefox**: DevTools → Storage → Manifest (or Application → Manifest). Confirm the manifest loads and icons are valid; Firefox does not always show a clear “not installable” message when criteria are not met.
