export async function GET() {
  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`;

  try {
    const res = await fetch(url, {
      headers: {
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""}`,
      },
      cache: "no-store",
    });

    const text = await res.text();

    return Response.json(
      {
        ok: res.ok,
        status: res.status,
        supabaseResponse: text,
        hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      },
      { status: res.ok ? 200 : 500 }
    );
  } catch (error) {
    return Response.json(
      { ok: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

