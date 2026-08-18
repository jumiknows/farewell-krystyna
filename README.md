# Farewell Krystyna

A cinematic Paris-themed farewell keepsake built for Krystyna and her team.

## Experiences

- `/` — the recipient experience: envelope reveal, farewell letter, cinematic postcard reader, café soundtrack, dimensional Paris animation, and finale
- `/studio` — the public teammate studio for previewing, adding, editing, and managing postcard messages

Messages are stored in Cloudflare D1 and appear dynamically on the recipient page.

## Technology

- React and Next.js App Router through Vinext
- Cloudflare Workers and D1
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
```

## Deployment

See [CLOUDFLARE_DEPLOYMENT.md](CLOUDFLARE_DEPLOYMENT.md).

No credentials, teammate lists, build output, or platform-specific project metadata are committed.
