const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const IMAGE_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};

export async function POST(request: Request) {
  const { env } = await import("cloudflare:workers");
  if (!env.BUCKET) {
    return Response.json({ error: "Postcard uploads are temporarily unavailable." }, { status: 503 });
  }

  let data: FormData;
  try {
    data = await request.formData();
  } catch {
    return Response.json({ error: "Please choose a valid image or animated GIF." }, { status: 400 });
  }

  const file = data.get("file");
  if (!(file instanceof File) || !IMAGE_EXTENSIONS[file.type]) {
    return Response.json({ error: "Choose a JPG, PNG, WebP, AVIF, or animated GIF." }, { status: 400 });
  }
  if (!file.size || file.size > MAX_UPLOAD_BYTES) {
    return Response.json({ error: "Images and GIFs need to be smaller than 5 MB." }, { status: 413 });
  }

  const key = `postcards/${crypto.randomUUID()}.${IMAGE_EXTENSIONS[file.type]}`;
  const label = file.name.trim().slice(0, 100) || (file.type === "image/gif" ? "Animated GIF" : "Postcard photo");

  try {
    await env.BUCKET.put(key, await file.arrayBuffer(), {
      httpMetadata: { contentType: file.type, cacheControl: "public, max-age=31536000, immutable" },
      customMetadata: { originalName: label.replace(/[^\x20-\x7e]/g, "_") },
    });
  } catch {
    return Response.json({ error: "We couldn’t save that image. Please try again." }, { status: 503 });
  }

  return Response.json({
    attachment: {
      kind: file.type === "image/gif" ? "gif" : "photo",
      src: `/api/media/${key}`,
      label,
    },
  }, { status: 201 });
}
