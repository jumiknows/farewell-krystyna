# Cloudflare deployment guide

## 1. Upload this project to GitHub

Extract the ZIP. In `jumiknows/farewell-krystyna`, choose **Add file → Upload files**, then drag the extracted contents into the repository and commit them to `main`.

## 2. Create the D1 database

In Cloudflare, open **Workers & Pages → D1 SQL database → Create database** and use `farewell-krystyna-messages`.

Copy its database ID. In `wrangler.jsonc`, replace `REPLACE_WITH_YOUR_D1_DATABASE_ID` with the real ID and commit the change.

## 3. Create a narrowly scoped API token

Create a Cloudflare token with only the permissions required to deploy Workers and edit D1. Never paste the token into source files.

## 4. Add GitHub Actions secrets

Open the GitHub repository, then **Settings → Secrets and variables → Actions**. Add:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

The included workflow installs dependencies, builds the app, applies the D1 migration and deploys whenever `main` changes.

## 5. Protect the teammate studio

In Cloudflare Zero Trust, create a self-hosted Access application for the deployed hostname. Protect these paths for approved teammate emails:

- `/studio*`
- `/api/messages*`

The app reads Cloudflare Access's authenticated email header server-side. Keep `/` outside the teammate-only policy unless you want it sign-in gated.

## 6. Separate Krystyna from editors

For strict recipient-only access, use two Access applications:

- `/studio*` and `/api/messages*`: allow only editor emails.
- `/`: allow only Krystyna's email.

If the farewell should open without sign-in, leave `/` public and share the link only with Krystyna.

## 7. Verify

1. Open `/` and test the music, letter, scrolling and finale.
2. Sign in as an approved teammate at `/studio`.
3. Add a test postcard.
4. Refresh `/` and confirm it appears.
5. Delete the test postcard.

Never commit API tokens, credentials or teammate email lists.
