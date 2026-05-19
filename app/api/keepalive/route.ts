export async function GET() {
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`, {
            headers: {
                apikey: process.env.SUPABASE_ANON_KEY!,
                Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
            },
            cache: "no-store",
        });

        return Response.json(
            { ok: res.ok, status: res.status, time: new Date().toISOString() },
            { status: res.ok ? 200 : 500 }
        );
    } catch (error) {
        return Response.json(
            { ok: false, error: (error as Error).message },
            { status: 500 }
        );
    }
}
