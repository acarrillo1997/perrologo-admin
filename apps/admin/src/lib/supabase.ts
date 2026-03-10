import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

type CookieMutation = {
  name: string;
  value: string;
  options?: Record<string, unknown>;
};

function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY are required"
    );
  }

  return { url, publishableKey };
}

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  const { url, publishableKey } = getSupabaseConfig();

  return createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: CookieMutation[]) {
        for (const cookie of cookiesToSet) {
          cookieStore.set(
            cookie.name,
            cookie.value,
            cookie.options as Parameters<typeof cookieStore.set>[2]
          );
        }
      }
    }
  });
}
