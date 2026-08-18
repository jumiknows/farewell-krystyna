import { getD1 } from "../../../../db";

type StoredPostcardImage = {
  content_type: string;
  content: number[] | ArrayBuffer | Uint8Array;
};

export async function GET(request: Request) {
  const key = new URL(request.url).pathname.replace(/^\/api\/media\//, "");
  if (!/^postcards\/[a-f\d-]{36}\.(?:jpg|jpeg|png|webp|gif|avif)$/i.test(key)) {
    return new Response("Postcard image not found.", { status: 404 });
  }

  try {
    const database = await getD1();
    const image = await database
      .prepare("SELECT content_type, content FROM postcard_uploads WHERE key = ?1")
      .bind(key)
      .first<StoredPostcardImage>();
    if (!image) return new Response("Postcard image not found.", { status: 404 });

    const body = image.content instanceof ArrayBuffer
      ? new Uint8Array(image.content)
      : Uint8Array.from(image.content);
    return new Response(body, {
      headers: {
        "content-type": image.content_type,
        "cache-control": "public, max-age=31536000, immutable",
        "x-content-type-options": "nosniff",
        etag: `"${key}"`,
      },
    });
  } catch {
    return new Response("Postcard image is temporarily unavailable.", { status: 503 });
  }
}
