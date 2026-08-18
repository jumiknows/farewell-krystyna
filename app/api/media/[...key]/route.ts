export async function GET(request: Request) {
  const key = new URL(request.url).pathname.replace(/^\/api\/media\//, "");
  if (!/^postcards\/[a-f\d-]{36}\.(?:jpg|jpeg|png|webp|gif|avif)$/i.test(key)) {
    return new Response("Postcard image not found.", { status: 404 });
  }

  const { env } = await import("cloudflare:workers");
  const object = await env.BUCKET?.get(key);
  if (!object) return new Response("Postcard image not found.", { status: 404 });

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("cache-control", "public, max-age=31536000, immutable");
  return new Response(object.body, { headers });
}
