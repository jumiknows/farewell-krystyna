import { desc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { farewellMessages } from "../../../db/schema";

export async function GET() {
  try {
    const db = await getDb();
    const rows = await db.select().from(farewellMessages).orderBy(desc(farewellMessages.createdAt));
    return Response.json({ messages: rows.map(row => ({ id: row.id, name: row.name, role: row.role, text: row.message, stamp: row.stamp })) });
  } catch {
    return Response.json({ error: "Postcards are temporarily unavailable." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const body = await request.json() as { name?: string; role?: string; message?: string; stamp?: string };
  const name = body.name?.trim().slice(0, 60) || "A teammate";
  const role = body.role?.trim().slice(0, 80) || "teammate";
  const message = body.message?.trim().slice(0, 900) || "";
  const stamp = body.stamp?.trim().slice(0, 24) || "WITH LOVE";
  if (message.length < 3) return Response.json({ error: "Please write a slightly longer message." }, { status: 400 });
  const db = await getDb();
  const [created] = await db.insert(farewellMessages).values({ name, role, message, stamp }).returning();
  return Response.json({ message: { id: created.id, name, role, text: message, stamp } }, { status: 201 });
}

export async function PATCH(request: Request) {
  const body = await request.json() as { id?: number; name?: string; role?: string; message?: string; stamp?: string };
  const id = Number(body.id);
  const name = body.name?.trim().slice(0, 60) || "A teammate";
  const role = body.role?.trim().slice(0, 80) || "teammate";
  const message = body.message?.trim().slice(0, 900) || "";
  const stamp = body.stamp?.trim().slice(0, 24) || "WITH LOVE";
  if (!Number.isInteger(id)) return Response.json({ error: "Invalid message." }, { status: 400 });
  if (message.length < 3) return Response.json({ error: "Please write a slightly longer message." }, { status: 400 });
  const db = await getDb();
  const [updated] = await db.update(farewellMessages).set({ name, role, message, stamp }).where(eq(farewellMessages.id, id)).returning();
  if (!updated) return Response.json({ error: "That postcard could not be found." }, { status: 404 });
  return Response.json({ message: { id, name, role, text: message, stamp } });
}

export async function DELETE(request: Request) {
  const id = Number(new URL(request.url).searchParams.get("id"));
  if (!Number.isInteger(id)) return Response.json({ error: "Invalid message." }, { status: 400 });
  const db = await getDb();
  await db.delete(farewellMessages).where(eq(farewellMessages.id, id));
  return Response.json({ ok: true });
}
