export async function onRequest(context) {
  const { request, env } = context;

  // Admin guard
  const key = request.headers.get("x-admin-key");
  if (!key || key !== env.ADMIN_KEY) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const ids = Array.isArray(body.ids) ? body.ids : [];
  const cleaned = [...new Set(ids.map(Number))].filter(n => Number.isInteger(n) && n > 0);

  if (cleaned.length === 0 || cleaned.length > 100) {
    return new Response("Provide 1-100 valid ids", { status: 400 });
  }

  const approvedBy = body.approvedBy ? String(body.approvedBy).slice(0, 80) : "admin";

  // Transaction: copy → update
  await env.DB.batch(
    cleaned.map((id) =>
      env.DB.prepare(`
        INSERT INTO car_loans (loan_amount_band, lender, interest_rate, source_unverified_id)
        SELECT loan_amount_band, lender, interest_rate, id
        FROM unverified_car_loans
        WHERE id = ? AND status = 'pending'
      `).bind(id)
    )
  );

  // Now mark approved + link approved_row_id
  // approved_row_id will be the car_loans.id for that source_unverified_id
  await env.DB.batch(
    cleaned.map((id) =>
      env.DB.prepare(`
        UPDATE unverified_car_loans
        SET status = 'approved',
            approved_at = CURRENT_TIMESTAMP,
            approved_by = ?,
            approved_row_id = (
              SELECT id FROM car_loans WHERE source_unverified_id = ?
            )
        WHERE id = ? AND status = 'pending'
      `).bind(approvedBy, id, id)
    )
  );

  return new Response(JSON.stringify({ ok: true, approved: cleaned.length }), {
    headers: { "content-type": "application/json", "cache-control": "no-store" }
  });
}
