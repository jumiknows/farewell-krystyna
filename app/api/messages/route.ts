import { desc, eq } from "drizzle-orm";
import {
  isTrustedPostcardMediaUrl,
  MAX_POSTCARD_MEDIA,
  MAX_POSTCARD_STICKERS,
  normalizePostcardStamp,
  POSTCARD_STICKERS,
  type PostcardAttachment,
  type PostcardSticker,
} from "../../postcard-media";
import { getDb } from "../../../db";
import { farewellMessages } from "../../../db/schema";

type MessageBody = {
  id?: number;
  name?: string;
  role?: string;
  message?: string;
  stamp?: string;
  media?: unknown;
  stickers?: unknown;
};

const POSTCARD_LOCKED = true;

function sanitizeMedia(value: unknown): PostcardAttachment[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is PostcardAttachment => {
      if (!item || typeof item !== "object") return false;
      const attachment = item as Partial<PostcardAttachment>;
      return (attachment.kind === "photo" || attachment.kind === "gif")
        && typeof attachment.src === "string"
        && isTrustedPostcardMediaUrl(attachment.src)
        && typeof attachment.label === "string";
    })
    .slice(0, MAX_POSTCARD_MEDIA)
    .map(item => ({ kind: item.kind, src: item.src, label: item.label.trim().slice(0, 100) || "Postcard image" }));
}

function sanitizeStickers(value: unknown): PostcardSticker[] {
  if (!Array.isArray(value)) return [];
  const validSymbols = new Set(POSTCARD_STICKERS.map(sticker => sticker.symbol));
  return value
    .filter((item): item is PostcardSticker => {
      if (!item || typeof item !== "object") return false;
      const sticker = item as Partial<PostcardSticker>;
      return typeof sticker.symbol === "string" && validSymbols.has(sticker.symbol) && typeof sticker.label === "string";
    })
    .slice(0, MAX_POSTCARD_STICKERS)
    .map(item => ({ symbol: item.symbol, label: item.label.trim().slice(0, 60) }));
}

function parseStoredJson(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return [];
  }
}

function toPublicMessage(row: typeof farewellMessages.$inferSelect) {
  return {
    id: row.id,
    name: row.name,
    role: row.role,
    text: row.message,
    stamp: normalizePostcardStamp(row.stamp),
    media: sanitizeMedia(parseStoredJson(row.media)),
    stickers: sanitizeStickers(parseStoredJson(row.stickers)),
  };
}

export async function GET() {
  try {
    const db = await getDb();
    const rows = await db.select().from(farewellMessages).orderBy(desc(farewellMessages.createdAt));
    return Response.json({ messages: rows.map(toPublicMessage) });
  } catch {
    return Response.json({ error: "Postcards are temporarily unavailable." }, { status: 500 });
  }
}

export async function POST(request: Request) {
    if (POSTCARD_LOCKED) {
    return Response.json(
      { error: "The farewell postcard is now closed 💛" },
      { status: 403 }
    );
  }
  const body = await request.json() as MessageBody;
  const name = body.name?.trim().slice(0, 60) || "A teammate";
  const role = body.role?.trim().slice(0, 80) || "teammate";
  const message = body.message?.trim().slice(0, 900) || "";
  const stamp = normalizePostcardStamp(body.stamp).slice(0, 24);
  const media = sanitizeMedia(body.media);
  const stickers = sanitizeStickers(body.stickers);
  if (message.length < 3) return Response.json({ error: "Please write a slightly longer message." }, { status: 400 });
  const db = await getDb();
  const [created] = await db.insert(farewellMessages).values({
    name,
    role,
    message,
    stamp,
    media: JSON.stringify(media),
    stickers: JSON.stringify(stickers),
  }).returning();
  return Response.json({ message: toPublicMessage(created) }, { status: 201 });
}

export async function PATCH(request: Request) {
    if (POSTCARD_LOCKED) {
    return Response.json(
      { error: "The farewell postcard is now closed 💛" },
      { status: 403 }
    );
  }
  const body = await request.json() as MessageBody;
  const id = Number(body.id);
  const name = body.name?.trim().slice(0, 60) || "A teammate";
  const role = body.role?.trim().slice(0, 80) || "teammate";
  const message = body.message?.trim().slice(0, 900) || "";
  const stamp = normalizePostcardStamp(body.stamp).slice(0, 24);
  const media = sanitizeMedia(body.media);
  const stickers = sanitizeStickers(body.stickers);
  if (!Number.isInteger(id)) return Response.json({ error: "Invalid message." }, { status: 400 });
  if (message.length < 3) return Response.json({ error: "Please write a slightly longer message." }, { status: 400 });
  const db = await getDb();
  const [updated] = await db.update(farewellMessages).set({
    name,
    role,
    message,
    stamp,
    media: JSON.stringify(media),
    stickers: JSON.stringify(stickers),
  }).where(eq(farewellMessages.id, id)).returning();
  if (!updated) return Response.json({ error: "That postcard could not be found." }, { status: 404 });
  return Response.json({ message: toPublicMessage(updated) });
}

export async function DELETE(request: Request) {
    if (POSTCARD_LOCKED) {
    return Response.json(
      { error: "The farewell postcard is now closed 💛" },
      { status: 403 }
    );
  }
  const id = Number(new URL(request.url).searchParams.get("id"));
  if (!Number.isInteger(id)) return Response.json({ error: "Invalid message." }, { status: 400 });
  const db = await getDb();
  await db.delete(farewellMessages).where(eq(farewellMessages.id, id));
  return Response.json({ ok: true });
}
