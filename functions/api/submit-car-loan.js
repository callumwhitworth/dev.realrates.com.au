export async function onRequest(context) {
  const { request, env } = context;

  // Only allow POST
  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  // Content-Type guard
  const contentType = request.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    return new Response("Expected application/json", { status: 415 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const loanAmountBand = String(body.loanAmountBand || "").trim();
  const lender = String(body.lender || "").trim();
  const interestRate = Number(body.interestRate);

  // Validation
  const allowedLoanAmountBands = new Set([
  "lt_5000","5000-9999","10000-14999","15000-19999","20000-29999","30000-39999","40000-49999","50000_plus"
]);
if (!allowedLoanAmountBands.has(loanAmountBand)) {
  return new Response("Invalid loanAmountBand", { status: 400 });
}


  if (!lender || lender.length < 2 || lender.length > 60) {
    return new Response("Invalid lender", { status: 400 });
  }

  if (!Number.isFinite(interestRate) || interestRate <= 0 || interestRate >= 50) {
    return new Response("Invalid interestRate", { status: 400 });
  }

  // Insert into unverified table
  const result = await env.DB
    .prepare(`
      INSERT INTO unverified_car_loans
      (loan_amount_band, lender, interest_rate)
      VALUES (?, ?, ?)
    `)
    .bind(loanAmountBand, lender, interestRate)
    .run();

  return new Response(
    JSON.stringify({ ok: true, id: result.meta.last_row_id }),
    {
      headers: {
        "content-type": "application/json",
        "cache-control": "no-store"
      }
    }
  );
}
