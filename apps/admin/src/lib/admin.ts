import { redirect } from "next/navigation";

import { getAuthenticatedUser } from "./auth";
import { getRepositories } from "./db";

export async function requireAdminSession() {
  const user = await getAuthenticatedUser();

  if (!user?.email) {
    redirect("/login");
  }

  const repositories = getRepositories();
  const admin = await repositories.admins.findByEmail(user.email);

  if (!admin || !admin.active) {
    redirect("/login");
  }

  return {
    user,
    admin
  };
}

export async function ensureApiAdmin() {
  const user = await getAuthenticatedUser();

  if (!user?.email) {
    return null;
  }

  const repositories = getRepositories();
  const admin = await repositories.admins.findByEmail(user.email);

  if (!admin || !admin.active) {
    return null;
  }

  return admin;
}
