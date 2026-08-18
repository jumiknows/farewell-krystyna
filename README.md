# Farewell Krystyna

A cinematic Paris-themed farewell keepsake built for Krystyna and her team.

## The experience

- `/` is Krystyna’s keepsake: a sealed-envelope reveal, personal letter, Paris café soundtrack, animated postcard reader, dimensional Paris details, teammate photos and GIFs, and a final Ottawa-to-Paris sendoff.
- `/studio` is the team’s correspondence atelier: a live postcard preview, thoughtful writing prompts, photo and GIF attachments, message emoji, curated Paris stickers, illustrated stamp choices, device-local draft recovery, contributor summaries, and straightforward postcard editing.

Messages and attachment metadata are stored in Cloudflare D1; uploaded photos and animated GIFs are stored in Cloudflare R2. Published postcards appear dynamically on the recipient page.
Both experiences work on desktop and small phones, preserve clean URLs, support keyboard navigation, and respect reduced-motion preferences.

## Privacy and access

The studio intentionally requires no account: anyone with its URL can contribute, edit, or remove a postcard. Share that link only with the intended team.

Unfinished drafts are saved only in the writer’s own browser. Published postcard details are stored in the configured Cloudflare D1 database, while uploaded media is retained in the configured Cloudflare R2 bucket.

## Technology

- React and Next.js App Router through Vinext
- Cloudflare Workers, D1, and R2
- Three.js for the dimensional flight, Eiffel Tower, and finale
- Drizzle ORM for the message schema
- Responsive, keyboard-accessible UI with reduced-motion support

## Local development

Requirements: Node.js 22 or newer.

```bash
npm ci
npm run dev
```

Production validation:

```bash
npm run build
npm run typecheck
npm test
```

## Deployment

See [CLOUDFLARE_DEPLOYMENT.md](CLOUDFLARE_DEPLOYMENT.md).

No credentials, teammate lists, build output, or platform-specific project metadata are committed.
