# Cloudflare deployment

This repository is designed for Cloudflare Workers Builds connected directly to GitHub.

## Build configuration

Use these settings in **Workers & Pages → farewell-krystyna → Settings → Builds**:

- Repository: `jumiknows/farewell-krystyna`
- Production branch: `main`
- Build command: `chmod +x scripts/*.sh && npm run build`
- Deploy command: `npx wrangler d1 migrations apply farewell-krystyna-messages --remote && npx wrangler deploy`
- Root directory: `/`

The D1 database and R2 media bucket bindings are already declared in `wrangler.jsonc`.

## One-time photo and GIF storage setup

Before deploying this version for the first time, create the R2 bucket named `farewell-krystyna-media`:

1. In Cloudflare, open **R2 object storage**.
2. If prompted, enable R2 for the account.
3. Choose **Create bucket** and enter `farewell-krystyna-media`.

Alternatively, if Wrangler is authenticated locally:

```bash
npx wrangler r2 bucket create farewell-krystyna-media
```

No bucket keys or R2 credentials belong in the repository. The Worker accesses its bucket through the existing `BUCKET` binding.

## First deployment

1. Create the `farewell-krystyna-media` R2 bucket once.
2. Upload or merge the repository contents into `main`.
3. Confirm the Cloudflare Git integration is connected.
4. Start a deployment, or let the push trigger it automatically.
5. Open `/studio` and add a temporary postcard with a photo, GIF, emoji, or sticker.
6. Open `/` and confirm the postcard and its extras appear.
7. Delete the temporary postcard from `/studio`.

## Access model

The recipient page and teammate studio are intentionally public. There is no authentication layer. Anyone with the `/studio` URL can add, edit, or delete messages, so share that URL only with the intended team.

## Routine updates

Every push to `main` triggers a new Cloudflare build. Database migrations are applied before the Worker is deployed.

Never commit Cloudflare tokens, credentials, or private teammate information.
