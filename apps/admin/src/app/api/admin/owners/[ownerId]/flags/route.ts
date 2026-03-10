import { NextResponse } from "next/server";
import { z } from "zod";

import { ensureApiAdmin } from "@/lib/admin";
import { getRepositories } from "@/lib/db";

const flagsSchema = z.object({
  blocked: z.enum(["true", "false"]).transform((value) => value === "true"),
  needsFollowUp: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
});

export async function POST(
  request: Request,
  context: { params: Promise<{ ownerId: string }> }
) {
  const admin = await ensureApiAdmin();

  if (!admin) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const parsed = flagsSchema.safeParse({
    blocked: formData.get("blocked"),
    needsFollowUp: formData.get("needsFollowUp")
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const { ownerId } = await context.params;
  const repositories = getRepositories();
  await repositories.owners.updateFlags(ownerId, parsed.data);

  return NextResponse.redirect(new URL(`/admin/owners/${ownerId}`, request.url), 303);
}
