import { NextResponse } from "next/server";
import { SUPABASE_KEY, SUPABASE_URL } from "@/lib/supabase";

const CHANNELS = new Set(["whatsapp", "telegram", "phone"]);

/** Contact-click tracking (WhatsApp / Telegram / phone) → Supabase `contact_clicks`; hosts see the counts in their dashboard. */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { kind?: string; id?: string | number; channel?: string };
    const slug = String(body.id ?? "").slice(0, 120);
    if (slug && body.channel && CHANNELS.has(body.channel)) {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/contact_clicks`, {
        method: "POST",
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json", Prefer: "return=minimal" },
        body: JSON.stringify({ listing_slug: body.kind === "driver" ? `driver-${slug}` : slug, channel: body.channel }),
      });
      if (!res.ok) console.error("[track]", res.status, await res.text());
    }
  } catch (e) {
    console.error("[track]", e);
  }
  return new NextResponse(null, { status: 204 });
}
