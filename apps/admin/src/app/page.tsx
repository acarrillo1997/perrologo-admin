import { redirect } from "next/navigation";

import { getAuthenticatedUser } from "../lib/auth";

export default async function HomePage() {
  const session = await getAuthenticatedUser();
  redirect(session ? "/admin" : "/login");
}
