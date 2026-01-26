import { convertToScores } from "../../lib/convertToScores.v1.js";

export async function onRequest(context) {
  const { request, env } = context;

  // Only allow POST
  if (request.method !== "POST") {
    return new Response("Method Not Allowed", {
      status: 405,
      headers: { Allow: "POST" },
    });
  }

  try {
    if (!env.DB) {
      return new Response(
        JSON.stringify({ error: "DB binding missing" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Parse input
    const input = await request.json();

    const sessionId = crypto.randomUUID();

    // Insert RAW search input (mirrors submit table)
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
    `)
      .bind(
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
      )
      .run();

    return new Response(
      JSON.stringify({
        ok: true,
        session_id: sessionId,
        expires_in_days: 30
      }),
      { headers: { "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("search-car-loan error:", err);

    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
