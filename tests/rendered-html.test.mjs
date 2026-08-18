import assert from "node:assert/strict";
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
  assert.match(studioHtml, /Add to Krystyna’s farewell/i);
  assert.match(studioHtml, /BEST WISHES/i);
  assert.doesNotMatch(studioHtml, /\bwith love\b|love letters|priority love|♥|✦|✧|No account needed|A surprise from the whole team|Find your words|Seal your postcard|Make her smile|qa-postcards|mobile-review/i);
});
