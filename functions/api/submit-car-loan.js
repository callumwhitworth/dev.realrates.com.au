export async function onRequestPost(context) {
  const { request, env } = context;

  // Basic content-type guard
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

  // Hard validation (keep it blunt)
  const allowedBands = new Set(["10000-15000", "15000-20000", "20000-30000"]);
  if (!allowedBands.has(loanAmountBand)) {
    return new Response("Invalid loanAmountBand", { status: 400 });
  }

  if (!lender || lender.length < 2 || lender.length > 60) {
    return new Response("Invalid lender", { status: 400 });
  }

  // interestRate is in percent (e.g. 12.49)
  if (!Number.isFinite(interestRate) || interestRate <= 0 || interestRate >= 50) {
    return new Response("Invalid interestRate", { status: 400 });
  }

  // Insert into your unverified table
  const stmt = env.DB.prepare(`
    INSERT INTO unverified_car_loans (loan_amount_band, lender, interest_rate)
    VALUES (?, ?, ?)
  `);

  const result = await stmt.bind(loanAmountBand, lender, interestRate).run();

  // Return inserted row id (useful for debugging; don’t show in UI later)
  return new Response(JSON.stringify({ ok: true, id: result.meta.last_row_id }), {
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store"
    }
  });
}
