# Delfino Security — Landing page

Author: Hélio Delfino Lopes de Alcântara — Security researcher & web penetration tester.

Static site (plain HTML + CSS + JS, no build step) presenting Delfino Security's three services:
codebase vulnerability analysis, automated Web + AI pentest and secure development consulting.

## Files

| File | Contents |
|---|---|
| `index.html` | Structure and PT-BR copy (default language) |
| `styles.css` | Visuals: color/font tokens, responsive layout |
| `main.js` | Contact settings, EN translations, e-mail copy button and radar animation |
| `favicon.svg` | `../` icon on a dark tile |

## Before publishing

1. The WhatsApp number lives in `WHATSAPP_NUMBER` in `main.js` (country + area code, digits only).
2. Review the copy that makes promises ("0 false positives").
3. To edit copy: change the PT-BR text in `index.html` and the matching EN string in the `EN` object in
   `main.js` (same `data-i18n` key).

## Run locally

Open `index.html` in a browser, or serve the folder:

```bash
py -3 -m http.server 8080
```

## Deploy

- **Vercel:** run `npx vercel` inside the folder (no framework, no build command).
- **Netlify:** drag the folder onto app.netlify.com/drop.
- **GitHub Pages:** push the folder to a repository and enable Pages on the `main` branch.

Then point your custom domain in the chosen service's settings.
