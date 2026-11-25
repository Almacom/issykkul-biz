import { NextResponse } from "next/server";

/**
 * Contact-click tracking (WhatsApp / Telegram / phone).
 * TODO: insert into Supabase table `contact_clicks` once the database is connected.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (process.env.NODE_ENV !== "production") console.log("[track]", body);
  } catch {}
  return new NextResponse(null, { status: 204 });
}
