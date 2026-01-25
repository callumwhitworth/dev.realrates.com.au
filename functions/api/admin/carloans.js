export async function onRequest(context) {
  const { request, env } = context;

  // Admin guard
  const key = request.headers.get("x-admin-key");
  if (!key || key !== env.ADMIN_KEY) return new Response("Unauthorized", { status: 401 });

  const url = new URL(request.url);
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit") || 20), 1), 200);

  const result = await env.DB.prepare(`
    SELECT id, loan_amount_band, lender, interest_rate, verified_at, source_unverified_id
    FROM car_loans
    ORDER BY verified_at DESC
    LIMIT ?
  `).bind(limit).all();

  return new Response(JSON.stringify({ ok: true, rows: result.results }), {
    headers: { "content-type": "application/json", "cache-control": "no-store" }
  });
}
