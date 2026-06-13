import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** OAuth redirect target — exchanges the code for a session cookie. */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const redirectTo = searchParams.get("redirectTo") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const forwardedHost = request.headers.get("x-forwarded-host");
      const isLocal = process.env.NODE_ENV === "development";
      if (isLocal) return NextResponse.redirect(`${origin}${redirectTo}`);
      if (forwardedHost) return NextResponse.redirect(`https://${forwardedHost}${redirectTo}`);
      return NextResponse.redirect(`${origin}${redirectTo}`);
    }
  }
  return NextResponse.redirect(`${origin}/login?error=auth`);
}
