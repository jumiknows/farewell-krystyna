import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { registerHooks } from "node:module";
import test from "node:test";

test("renders the colleague-friendly farewell and collaborative postcard studio", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  const environment = {
    ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) },
  };
  const context = { waitUntil() {}, passThroughOnException() {} };

  const response = await worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    environment,
    context,
  );
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /Au revoir, Krystyna/i);
  assert.match(html, /from the team/i);
  assert.match(html, /Send Krystyna your best wishes/i);
  assert.doesNotMatch(html, /\bwith love\b|love letters|priority love|♥|✦|✧/i);

  const studioResponse = await worker.fetch(
    new Request("http://localhost/studio", { headers: { accept: "text/html" } }),
    environment,
    context,
  );
  assert.equal(studioResponse.status, 200);
  assert.match(studioResponse.headers.get("content-type") ?? "", /^text\/html\b/i);
  const studioHtml = await studioResponse.text();
  assert.match(studioHtml, /something memorable/i);
  assert.match(studioHtml, /Personalize your postcard/i);
  assert.match(studioHtml, />Photo</i);
  assert.match(studioHtml, />GIF</i);
  assert.match(studioHtml, />Emoji</i);
  assert.match(studioHtml, />Sticker</i);
  assert.match(studioHtml, /postcard-file-input/i);
  assert.match(studioHtml, /aria-hidden="true"[^>]*type="file"|type="file"[^>]*aria-hidden="true"/i);
  assert.match(studioHtml, /Add to Krystyna’s farewell/i);
  assert.match(studioHtml, /BEST WISHES/i);
  assert.doesNotMatch(studioHtml, /\bwith love\b|love letters|priority love|♥|✦|✧|No account needed|A surprise from the whole team|Find your words|Seal your postcard|Make her smile|qa-postcards|mobile-review/i);
});

test("keeps responsive postcard chapters crisp, aligned, and uncropped", async () => {
  const [stylesheet, homepage, studio, gallery] = await Promise.all([
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/studio/studio-client.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/postcard-media-gallery.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(stylesheet, /\.reveal-gate\{overflow:clip\}/);
  assert.match(stylesheet, /\.paper-grain\{opacity:\.045\}/);
  assert.match(stylesheet, /\.note,\.note-1,\.note-2,\.note-3\{[^}]*transform:none;[^}]*will-change:auto;/s);
  assert.match(stylesheet, /\.postcard-file-input\{display:none!important\}/);
  assert.match(stylesheet, /\.postcard-photo>img\{[^}]*width:auto;[^}]*height:auto;[^}]*aspect-ratio:auto;[^}]*object-fit:contain;/s);
  assert.match(stylesheet, /\.recipient-media \.postcard-photo>img\{/);
  assert.match(stylesheet, /\.focused-media \.postcard-photo>img\{/);
  assert.match(stylesheet, /@media\(min-width:851px\) and \(max-height:800px\)/);
  assert.match(stylesheet, /@media\(max-height:690px\) and \(max-width:760px\)\{\s*\.paris\{/);
  assert.match(homepage, /scrollIntoView\(\{ behavior: "smooth", block: "start", inline: "nearest" \}\)/);
  assert.doesNotMatch(homepage, /onPointerMove=\{tiltPostcard\}/);
  assert.match(studio, /className="postcard-file-input"/);
  assert.match(studio, /className=\{`photo-dropzone/);
  assert.match(studio, /onDrop=\{/);
  assert.match(studio, /onPaste=\{/);
  assert.match(gallery, /<figure className=/);
});

test("stores and serves postcard photos using D1 without an R2 bucket", async () => {
  const uploads = new Map();
  const database = {
    prepare() {
      return {
        bind(...values) {
          this.values = values;
          return this;
        },
        async run() {
          const [key, contentType, content] = this.values;
          uploads.set(key, {
            content_type: contentType,
            content: Array.from(new Uint8Array(content)),
          });
          return { success: true };
        },
        async first() {
          return uploads.get(this.values[0]) ?? null;
        },
      };
    },
  };

  globalThis.__farewellDatabaseTestEnv = { DB: database };
  const hooks = registerHooks({
    resolve(specifier, context, nextResolve) {
      if (specifier === "cloudflare:workers") {
        return {
          url: "data:text/javascript,export const env = globalThis.__farewellDatabaseTestEnv",
          shortCircuit: true,
        };
      }
      return nextResolve(specifier, context);
    },
  });

  try {
    const workerUrl = new URL("../dist/server/index.js", import.meta.url);
    workerUrl.searchParams.set("media-test", `${process.pid}-${Date.now()}`);
    const { default: worker } = await import(workerUrl.href);
    const environment = {
      ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) },
      DB: database,
    };
    const context = { waitUntil() {}, passThroughOnException() {} };
    const photo = Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10, 0, 1, 2, 3]);
    const form = new FormData();
    form.append("file", new File([photo], "postcard.png", { type: "image/png" }));

    const upload = await worker.fetch(
      new Request("http://localhost/api/media", { method: "POST", body: form }),
      environment,
      context,
    );
    assert.equal(upload.status, 201);
    const { attachment } = await upload.json();
    assert.equal(attachment.kind, "photo");
    assert.match(attachment.src, /^\/api\/media\/postcards\/[a-f\d-]{36}\.png$/i);

    const image = await worker.fetch(
      new Request(`http://localhost${attachment.src}`),
      environment,
      context,
    );
    assert.equal(image.status, 200);
    assert.equal(image.headers.get("content-type"), "image/png");
    assert.deepEqual(new Uint8Array(await image.arrayBuffer()), photo);
  } finally {
    hooks.deregister();
    delete globalThis.__farewellDatabaseTestEnv;
  }
});
