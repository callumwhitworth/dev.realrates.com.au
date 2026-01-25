export async function onRequest(context) {
  const { request, env } = context;

  // Admin guard
  const key = request.headers.get("x-admin-key");
  if (!key || key !== env.ADMIN_KEY) {
    return new Response("Unauthorized", { status: 401 });
  }

  const url = new URL(request.url);
  const status = (url.searchParams.get("status") || "pending").trim();

  const allowed = new Set(["pending", "approved", "rejected"]);
  if (!allowed.has(status)) {
    return new Response("Invalid status", { status: 400 });
  }

  const result = await env.DB.prepare(`
    SELECT id, loan_amount_band, lender, interest_rate, submitted_at, status
    FROM unverified_car_loans
    WHERE status = ?
    ORDER BY submitted_at DESC
    LIMIT 200
  `).bind(status).all();

  return new Response(JSON.stringify({ ok: true, rows: result.results }), {
    headers: { "content-type": "application/json", "cache-control": "no-store" }
  });
}
