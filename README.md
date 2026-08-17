# Farewell Krystyna

An animated Paris-themed farewell experience with two connected surfaces:

- `/` — Krystyna's polished farewell experience
- `/studio` — the teammate postcard studio

Messages are stored in Cloudflare D1. The studio supports Cloudflare Access, so approved teammates can sign in with their email while the recipient page remains presentation-focused.

## Included

- Responsive Paris-inspired design
- User-controlled ambient music, mute and volume controls
- Interactive farewell letter and finale
- Durable teammate messages stored in D1
- GitHub Actions deployment workflow
- Cloudflare Access-compatible editor identity
- No committed credentials

## Deploy

Follow [CLOUDFLARE_DEPLOYMENT.md](CLOUDFLARE_DEPLOYMENT.md). Initial setup requires a Cloudflare account, a D1 database, two GitHub repository secrets and a Cloudflare Access policy.

## Local validation

```bash
npm ci
npm run build
```

Node.js 22 or newer is required.
