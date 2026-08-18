# Cloudflare deployment

This repository is designed for Cloudflare Workers Builds connected directly to GitHub.

## Build configuration

Use these settings in **Workers & Pages → farewell-krystyna → Settings → Builds**:

- Repository: `jumiknows/farewell-krystyna`
- Production branch: `main`
- Build command: `chmod +x scripts/*.sh && npm run build`
- Deploy command: `npx wrangler d1 migrations apply farewell-krystyna-messages --remote && npx wrangler deploy`
- Root directory: `/`

The D1 binding and database ID are already declared in `wrangler.jsonc`.

## First deployment

1. Upload or merge the repository contents into `main`.
2. Confirm the Cloudflare Git integration is connected.
3. Start a deployment, or let the push trigger it automatically.
4. Open `/studio` and add a temporary postcard.
5. Open `/` and confirm the postcard appears.
6. Delete the temporary postcard from `/studio`.

## Access model

The recipient page and teammate studio are intentionally public. There is no authentication layer. Anyone with the `/studio` URL can add, edit, or delete messages, so share that URL only with the intended team.

## Routine updates

Every push to `main` triggers a new Cloudflare build. Database migrations are applied before the Worker is deployed.

Never commit Cloudflare tokens, credentials, or private teammate information.
