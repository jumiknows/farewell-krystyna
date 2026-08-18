import { getD1 } from "../../../db";

const MAX_UPLOAD_BYTES = 1_750_000;
const IMAGE_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};

export async function POST(request: Request) {
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
    return Response.json({ error: "That image is too large. Try another photo or add your GIF as a GIPHY link." }, { status: 413 });
  }

  const key = `postcards/${crypto.randomUUID()}.${IMAGE_EXTENSIONS[file.type]}`;
  const label = file.name.trim().slice(0, 100) || (file.type === "image/gif" ? "Animated GIF" : "Postcard photo");

  try {
    const database = await getD1();
    await database
      .prepare("INSERT INTO postcard_uploads (key, content_type, content) VALUES (?1, ?2, ?3)")
      .bind(key, file.type, await file.arrayBuffer())
      .run();
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
