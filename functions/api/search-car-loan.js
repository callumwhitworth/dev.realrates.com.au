import { convertToScores } from "../lib/convertToScores.v1.js";

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method !== "POST") {
    return new Response("Method Not Allowed", {
      status: 405,
      headers: { Allow: "POST" }
    });
  }

  try {
    if (!env.DB) {
      throw new Error("DB binding missing");
    }

    // -------- Parse input --------
    const input = await request.json();
    const sessionId = crypto.randomUUID();

    // -------- Store RAW search intent --------
    await env.DB.prepare(`
      INSERT INTO customer_search_car_loan (
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
        session_id,
        expires_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, DATETIME('now','+30 days')
      )
    `).bind(
      input.state,
      input.applicationChannel,
      input.incomeBand,
      input.employmentStatus,
      input.ageBand || null,
      input.housingStatus,
      input.rentPaymentBand || null,
      input.mortgagePaymentBand || null,
      input.dependents,
      input.monthlyDebtRepaymentsBand || null,
      input.liquidAssetsBand || null,
      input.loanAmountBand,
      input.loanPurpose || null,
      Number(input.loanTermMonths),
      input.guarantor || null,
      input.depositPercentBand || null,
      input.vehicleAgeBand || null,
      sessionId
    ).run();

    // -------- Build pseudo-row for scoring --------
    const searchRow = {
      state: input.state,
      application_channel: input.applicationChannel,
      income_band: input.incomeBand,
      employment_status: input.employmentStatus,
      age_band: input.ageBand || null,
      housing_status: input.housingStatus,
      rent_payment_band: input.rentPaymentBand || null,
      mortgage_payment_band: input.mortgagePaymentBand || null,
      dependents: input.dependents,
      monthly_debt_repayments_band: input.monthlyDebtRepaymentsBand || null,
      liquid_assets_band: input.liquidAssetsBand || null,
      loan_amount_band: input.loanAmountBand,
      loan_purpose: input.loanPurpose || null,
      loan_term_months: Number(input.loanTermMonths),
      guarantor: input.guarantor || null,
      deposit_percent_band: input.depositPercentBand || null,
      vehicle_age_band: input.vehicleAgeBand || null
    };

    // -------- Ephemeral scoring --------
    const searchScores = convertToScores(searchRow);

    // -------- First-pass candidate fetch --------
    const scoredCandidates = await env.DB.prepare(`
      SELECT
        source_verified_id,
        svc_score,
        loan_risk_score,
        stability_score,
        liquidity_score,
        channel_score,
        composite_score
      FROM car_loans_scored
      WHERE scoring_model_version = 'v1.0'
      ORDER BY ABS(composite_score - ?)
      LIMIT 50
    `).bind(searchScores.composite_score).all();

    const rows = scoredCandidates.results || [];

    // -------- Distance function --------
    const distance = (a, b) =>
      Math.abs(a.svc_score - b.svc_score) * 0.35 +
      Math.abs(a.loan_risk_score - b.loan_risk_score) * 0.30 +
      Math.abs(a.stability_score - b.stability_score) * 0.20 +
      Math.abs(a.liquidity_score - b.liquidity_score) * 0.10 +
      Math.abs(a.channel_score - b.channel_score) * 0.05;

    // -------- Rank and pick top 5 --------
    const topMatches = rows
      .map(r => ({ ...r, dist: distance(searchScores, r) }))
      .sort((a, b) => a.dist - b.dist)
      .slice(0, 5);

    const ids = topMatches.map(r => r.source_verified_id);

    if (ids.length === 0) {
      return new Response(JSON.stringify({
        ok: true,
        session_id: sessionId,
        comparables: [],
        sample_size: 0
      }), { headers: { "Content-Type": "application/json" } });
    }

    // -------- Fetch real verified loans --------
    const placeholders = ids.map(() => "?").join(",");

    const loansRes = await env.DB.prepare(`
      SELECT
        lender,
        interest_rate,
        loan_amount_band,
        loan_term_months,
        state,
        application_channel
      FROM car_loans
      WHERE id IN (${placeholders})
    `).bind(...ids).all();

    return new Response(JSON.stringify({
      ok: true,
      session_id: sessionId,
      sample_size: loansRes.results.length,
      comparables: loansRes.results
    }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    console.error("search-car-loan error:", err);

    return new Response(JSON.stringify({
      ok: false,
      error: err.message
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
