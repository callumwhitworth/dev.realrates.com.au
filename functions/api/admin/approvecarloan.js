import { convertToScores } from "../lib/convertToScores.v1.js";

export async function onRequest(context) {
  const { request, env } = context;

  // ---- Admin guard ----
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
  const cleaned = [...new Set(ids.map(Number))].filter(
    n => Number.isInteger(n) && n > 0
  );

  if (cleaned.length === 0 || cleaned.length > 100) {
    return new Response("Provide 1–100 valid ids", { status: 400 });
  }

  const approvedBy = body.approvedBy
    ? String(body.approvedBy).slice(0, 80)
    : "admin";

  // ---- Step 1: copy unverified → verified (car_loans) ----
  await env.DB.batch(
    cleaned.map(id =>
      env.DB.prepare(`
        INSERT INTO car_loans (
          lender,
          interest_rate,
          state,
          application_channel,
          income_band,
          employment_status,
          age_band,
          housing_status,
          rent_payment_band,
          mortgage_payment_band,
          dependents,
          monthly_debt_repayments_band,
          liquid_assets_band,
          loan_amount_band,
          loan_purpose,
          loan_term_months,
          guarantor,
          deposit_percent_band,
          vehicle_age_band,
          source_unverified_id
        )
        SELECT
          lender,
          interest_rate,
          state,
          application_channel,
          income_band,
          employment_status,
          age_band,
          housing_status,
          rent_payment_band,
          mortgage_payment_band,
          dependents,
          monthly_debt_repayments_band,
          liquid_assets_band,
          loan_amount_band,
          loan_purpose,
          loan_term_months,
          guarantor,
          deposit_percent_band,
          vehicle_age_band,
          id
        FROM unverified_car_loans
        WHERE id = ? AND status = 'pending'
      `).bind(id)
    )
  );

  // ---- Step 2: mark unverified rows as approved ----
  await env.DB.batch(
    cleaned.map(id =>
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

  // ---- Step 3: score newly approved rows ----
  for (const id of cleaned) {
    const rowRes = await env.DB.prepare(`
      SELECT *
      FROM car_loans
      WHERE source_unverified_id = ?
    `).bind(id).first();

    if (!rowRes) continue;

    const scores = convertToScores(rowRes);

    await env.DB.prepare(`
      INSERT OR IGNORE INTO car_loans_scored (
        source_verified_id,
        scoring_model_version,
        svc_score,
        loan_risk_score,
        stability_score,
        liquidity_score,
        channel_score,
        composite_score,
        income_mid,
        housing_payment_mid,
        debt_repayment_mid,
        liquid_assets_mid,
        loan_amount_mid,
        deposit_percent_mid,
        vehicle_age_mid,
        loan_term_months
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
      )
    `).bind(
      rowRes.id,
      scores.scoring_model_version,
      scores.svc_score,
      scores.loan_risk_score,
      scores.stability_score,
      scores.liquidity_score,
      scores.channel_score,
      scores.composite_score,
      scores.income_mid,
      scores.housing_payment_mid,
      scores.debt_repayment_mid,
      scores.liquid_assets_mid,
      scores.loan_amount_mid,
      scores.deposit_percent_mid,
      scores.vehicle_age_mid,
      scores.loan_term_months
    ).run();
  }

  return new Response(
    JSON.stringify({ ok: true, approved: cleaned.length }),
    {
      headers: {
        "content-type": "application/json",
        "cache-control": "no-store"
      }
    }
  );
}
