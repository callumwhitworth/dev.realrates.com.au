export async function onRequest(context) {
  const { request, env } = context;

  if (request.method !== "POST") return new Response("Method Not Allowed", { status: 405 });

  const ct = request.headers.get("content-type") || "";
  if (!ct.includes("application/json")) return new Response("Expected application/json", { status: 415 });

  let body;
  try { body = await request.json(); }
  catch { return new Response("Invalid JSON", { status: 400 }); }

  // Extract + normalize
  const lender = String(body.lender || "").trim();
  const interestRate = Number(body.interestRate);

  const state = String(body.state || "").trim();
  const applicationChannel = String(body.applicationChannel || "").trim();

  const incomeBand = String(body.incomeBand || "").trim();
  const employmentStatus = String(body.employmentStatus || "").trim();
  const ageBand = String(body.ageBand || "").trim();
  const housingStatus = String(body.housingStatus || "").trim();
  const rentPaymentBand = body.rentPaymentBand ? String(body.rentPaymentBand).trim() : null;
  const mortgagePaymentBand = body.mortgagePaymentBand ? String(body.mortgagePaymentBand).trim() : null;
  const dependents = String(body.dependents || "").trim();
  const monthlyDebtRepaymentsBand = String(body.monthlyDebtRepaymentsBand || "").trim();
  const liquidAssetsBand = String(body.liquidAssetsBand || "").trim();

  const loanAmountBand = String(body.loanAmountBand || "").trim();
  const loanPurpose = String(body.loanPurpose || "").trim();
  const loanTermMonths = String(body.loanTermMonths || "").trim();
  const guarantor = String(body.guarantor || "").trim();
  const depositPercentBand = String(body.depositPercentBand || "").trim();
  const vehicleAgeBand = String(body.vehicleAgeBand || "").trim();

  // Validation
  if (!lender || lender.length < 2 || lender.length > 60) return new Response("Invalid lender", { status: 400 });
  if (!Number.isFinite(interestRate) || interestRate <= 0 || interestRate >= 50) return new Response("Invalid interestRate", { status: 400 });

  const allowedStates = new Set(["VIC","NSW","QLD","SA","WA","TAS","ACT","NT"]);
  if (!allowedStates.has(state)) return new Response("Invalid state", { status: 400 });

  const allowedChannels = new Set(["online","branch","broker","dealer"]);
  if (!allowedChannels.has(applicationChannel)) return new Response("Invalid applicationChannel", { status: 400 });

  const allowedIncome = new Set([
    "lt_40000","40000-49999","50000-59999","60000-69999","70000-79999","80000-89999","90000-99999",
    "100000-109999","110000-119999","120000-129999","130000-149999","150000-179999","180000-219999","220000_plus"
  ]);
  if (!allowedIncome.has(incomeBand)) return new Response("Invalid incomeBand", { status: 400 });

  const allowedEmployment = new Set(["ft_1y_plus","ft_under_1y","pt","casual","self_employed_1y_plus","self_employed_under_1y","unemployed"]);
  if (!allowedEmployment.has(employmentStatus)) return new Response("Invalid employmentStatus", { status: 400 });

  const allowedAge = new Set(["18-24","25-34","35-44","45-54","55-64","65_plus"]);
  if (!allowedAge.has(ageBand)) return new Response("Invalid ageBand", { status: 400 });

  const allowedHousing = new Set(["owner_mortgage","owner_outright","renting","living_with_family","other"]);
  if (!allowedHousing.has(housingStatus)) return new Response("Invalid housingStatus", { status: 400 });

  const allowedPayment = new Set(["lt_1000","1000-1499","1500-1999","2000-2499","2500-2999","3000-3999","4000_plus"]);
  // enforce conditional fields
  if (housingStatus === "renting") {
    if (!rentPaymentBand || !allowedPayment.has(rentPaymentBand)) return new Response("Invalid rentPaymentBand", { status: 400 });
  }
  if (housingStatus === "owner_mortgage") {
    if (!mortgagePaymentBand || !allowedPayment.has(mortgagePaymentBand)) return new Response("Invalid mortgagePaymentBand", { status: 400 });
  }

  const allowedDependents = new Set(["0","1","2","3","4","5_plus"]);
  if (!allowedDependents.has(dependents)) return new Response("Invalid dependents", { status: 400 });

  const allowedDebt = new Set(["0","1-199","200-499","500-999","1000-1499","1500-2499","2500_plus"]);
  if (!allowedDebt.has(monthlyDebtRepaymentsBand)) return new Response("Invalid monthlyDebtRepaymentsBand", { status: 400 });

  const allowedAssets = new Set(["lt_1000","1000-4999","5000-9999","10000-19999","20000-49999","50000-99999","100000_plus"]);
  if (!allowedAssets.has(liquidAssetsBand)) return new Response("Invalid liquidAssetsBand", { status: 400 });

  const allowedLoanAmount = new Set(["lt_5000","5000-9999","10000-14999","15000-19999","20000-29999","30000-39999","40000-49999","50000_plus"]);
  if (!allowedLoanAmount.has(loanAmountBand)) return new Response("Invalid loanAmountBand", { status: 400 });

  const allowedPurpose = new Set(["car_new","car_used","personal_debt_consolidation","personal_wedding","personal_medical","personal_travel","personal_home_improvement","other"]);
  if (!allowedPurpose.has(loanPurpose)) return new Response("Invalid loanPurpose", { status: 400 });

  const allowedTerm = new Set(["12","24","36","48","60","72","84"]);
  if (!allowedTerm.has(loanTermMonths)) return new Response("Invalid loanTermMonths", { status: 400 });

  const allowedGuarantor = new Set(["none","yes"]);
  if (!allowedGuarantor.has(guarantor)) return new Response("Invalid guarantor", { status: 400 });

  const allowedDeposit = new Set(["0","1-9","10-19","20-29","30_plus"]);
  if (!allowedDeposit.has(depositPercentBand)) return new Response("Invalid depositPercentBand", { status: 400 });

  const allowedVehicleAge = new Set(["new","1-3","4-7","8-12","13_plus"]);
  if (!allowedVehicleAge.has(vehicleAgeBand)) return new Response("Invalid vehicleAgeBand", { status: 400 });

  // Insert (match your new schema exactly)
  try {
    const result = await env.DB.prepare(`
      INSERT INTO unverified_car_loans (
        lender, interest_rate,
        state, application_channel,
        income_band, employment_status, age_band, housing_status, rent_payment_band, mortgage_payment_band,
        dependents, monthly_debt_repayments_band, liquid_assets_band,
        loan_amount_band, loan_purpose, loan_term_months, guarantor, deposit_percent_band, vehicle_age_band
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      lender, interestRate,
      state, applicationChannel,
      incomeBand, employmentStatus, ageBand, housingStatus, rentPaymentBand, mortgagePaymentBand,
      dependents, monthlyDebtRepaymentsBand, liquidAssetsBand,
      loanAmountBand, loanPurpose, loanTermMonths, guarantor, depositPercentBand, vehicleAgeBand
    ).run();

    return new Response(JSON.stringify({ ok: true, id: result.meta.last_row_id }), {
      headers: { "content-type": "application/json", "cache-control": "no-store" }
    });
  } catch (err) {
    // show real error while you're building
    return new Response("Server error: " + (err?.message || String(err)), { status: 500 });
  }
}
