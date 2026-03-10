import { NextResponse } from "next/server";

import { ensureApiAdmin } from "@/lib/admin";
import { getInbox } from "@/lib/inbox";

export async function GET(request: Request) {
  const admin = await ensureApiAdmin();

  if (!admin) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? undefined;
  const inbox = await getInbox(q);

  return NextResponse.json({
    conversations: inbox
  });
}
