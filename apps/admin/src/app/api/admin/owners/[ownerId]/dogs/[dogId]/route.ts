import { NextResponse } from "next/server";
import { z } from "zod";

import { ensureApiAdmin } from "@/lib/admin";
import { getRepositories } from "@/lib/db";

const dogSchema = z.object({
  name: z.string().min(1),
  breed: z.string().min(1),
  age: z.string().min(1),
  weight: z.string().min(1),
  sex: z.string().optional(),
  neutered: z.enum(["true", "false", "unknown"])
});

export async function POST(
  request: Request,
  context: { params: Promise<{ ownerId: string; dogId: string }> }
) {
  const admin = await ensureApiAdmin();

  if (!admin) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const parsed = dogSchema.safeParse({
    name: formData.get("name"),
    breed: formData.get("breed"),
    age: formData.get("age"),
    weight: formData.get("weight"),
    sex: formData.get("sex") || undefined,
    neutered: formData.get("neutered")
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const { ownerId, dogId } = await context.params;
  const repositories = getRepositories();

  await repositories.dogs.update(dogId, {
    ...parsed.data,
    sex: parsed.data.sex || null,
    neutered:
      parsed.data.neutered === "unknown" ? null : parsed.data.neutered === "true"
  });

  return NextResponse.redirect(new URL(`/admin/owners/${ownerId}`, request.url), 303);
}
