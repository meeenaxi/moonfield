# MoonField website

Static site (no build step). Open `index.html` to preview.

## 1. Fill in `assets/js/config.js`
- `whatsappNumber` — e.g. `919876543210` (turns on the WhatsApp buttons)
- `email` — shown in the contact section
- `supabaseUrl` / `supabaseAnonKey` — see step 3
- `cfAnalyticsToken` — see step 4

## 2. Publish free on GitHub Pages
1. Create a GitHub repo named `moonfield`, upload everything in this folder (not the old bundled `.html`).
2. Repo > Settings > Pages > Source: `main` branch, `/ (root)`.
3. Your URL will be `https://<username>.github.io/moonfield/`.
4. Replace `YOUR-USERNAME` in `index.html` (canonical + og:image), `robots.txt` and `sitemap.xml`.
5. Submit the URL in Google Search Console and add your Google Business Profile.

## 3. Supabase (stores form leads)
1. New project at supabase.com. SQL Editor: run `supabase/schema.sql`.
2. Settings > API: copy the Project URL and the `anon` public key into `config.js`.
3. Leads appear in Table Editor > `leads`. Visitors can only add rows, never read them.

## 4. Cloudflare Web Analytics (free, no cookies)
Cloudflare dashboard > Analytics & Logs > Web Analytics > Add a site > enter your `github.io` hostname > copy the token into `config.js`.
Shows country, region, device, browser, referrer and pages. It does not show age or gender.

## Later, when you have a domain
Add it in GitHub Pages settings, move DNS to Cloudflare to get the WAF, bot protection and security headers, and update the URLs from step 2.
