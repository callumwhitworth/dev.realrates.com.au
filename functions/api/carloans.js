export async function onRequest(context) {
  const { request, env } = context;

  if (request.method !== "GET") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const url = new URL(request.url);

  // Simple filters (optional)
  const lender = (url.searchParams.get("lender") || "").trim();
  const band = (url.searchParams.get("band") || "").trim();

  const limit = Math.min(Math.max(Number(url.searchParams.get("limit") || 50), 1), 200);

  // Build query (safe, parameterized)
  let sql = `
    SELECT id, loan_amount_band, lender, interest_rate, verified_at
    FROM car_loans
    WHERE 1=1
  `;
  const binds = [];

  if (lender) {
    sql += ` AND lender = ?`;
    binds.push(lender);
  }

  if (band) {
    sql += ` AND loan_amount_band = ?`;
    binds.push(band);
  }

  sql += ` ORDER BY verified_at DESC LIMIT ?`;
  binds.push(limit);

  const result = await env.DB.prepare(sql).bind(...binds).all();

  return new Response(JSON.stringify({ ok: true, rows: result.results }), {
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store"
    }
  });
}
