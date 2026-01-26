/**
 * convertToScores.v1.js
 * Deterministic, lender-like scoring for similarity matching
 * All scores are 0 (best) → 1 (worst)
 */

const SCORING_MODEL_VERSION = "v1.0";

// ---------- helpers ----------
const clamp = (v, min = 0, max = 1) => Math.max(min, Math.min(max, v));

const norm = (v, min, max) => {
  if (max === min) return 0;
  return clamp((v - min) / (max - min));
};

// ---------- categorical mappings ----------
const EMPLOYMENT_SCORE = {
  "permanent_full_time": 0.0,
  "permanent_part_time": 0.2,
  "contract": 0.4,
  "casual": 0.7,
  "self_employed": 0.6,
  "unemployed": 1.0
};

const HOUSING_SCORE = {
  "owner_outright": 0.0,
  "owner_mortgage": 0.2,
  "renting": 0.6,
  "living_with_family": 0.3
};

const CHANNEL_SCORE = {
  "direct_online": 0.0,
  "branch": 0.1,
  "broker": 0.3,
  "third_party": 0.4,
  "promo": -0.1
};

// ---------- main ----------
export function convertToScores(row) {
  // ---- numeric mids (assumed already numeric) ----
  const incomeMid = row.income_band * 1000; // 65 → 65000
  const rentMid = row.rent_payment_band || 0;
  const mortgageMid = row.mortgage_payment_band || 0;
  const housingMid = rentMid + mortgageMid;
  const debtMid = row.monthly_debt_repayments_band || 0;
  const liquidMid = row.liquid_assets_band || 0;
  const loanAmountMid = row.loan_amount_band || 0;
  const depositMid = row.deposit_percent_band || 0;
  const vehicleAgeMid = row.vehicle_age_band || 0;
  const loanTermMonths = row.loan_term_months;

  const monthlyIncome = incomeMid / 12;
  const fixedOutgoings = housingMid + debtMid;

  // ---------- SERVICEABILITY (dominant) ----------
  const svcRatio = fixedOutgoings / Math.max(monthlyIncome, 1);
  const svcScore = clamp(norm(svcRatio, 0.15, 0.55));

  // ---------- STABILITY ----------
  const employmentScore = EMPLOYMENT_SCORE[row.employment_status] ?? 0.5;
  const housingScore = HOUSING_SCORE[row.housing_status] ?? 0.5;
  const agePenalty = norm(row.age_band || 35, 18, 65); // mild curve
  const dependentsPenalty = clamp((row.dependents || 0) * 0.1);

  const stabilityScore = clamp(
    employmentScore * 0.4 +
    housingScore * 0.3 +
    agePenalty * 0.2 +
    dependentsPenalty * 0.1
  );

  // ---------- LIQUIDITY ----------
  const bufferMonths = liquidMid / Math.max(fixedOutgoings, 1);
  const liquidityScore = clamp(1 - norm(bufferMonths, 1, 6));

  // ---------- LOAN RISK ----------
  const amountToIncome = loanAmountMid / Math.max(incomeMid, 1);
  const amountScore = norm(amountToIncome, 0.2, 1.2);
  const termScore = norm(loanTermMonths, 12, 84);
  const depositScore = 1 - norm(depositMid, 5, 30);
  const vehicleScore = norm(vehicleAgeMid, 1, 10);

  const loanRiskScore = clamp(
    amountScore * 0.35 +
    termScore * 0.25 +
    depositScore * 0.25 +
    vehicleScore * 0.15
  );

  // ---------- CHANNEL ----------
  const channelScore = clamp(CHANNEL_SCORE[row.application_channel] ?? 0.2);

  // ---------- COMPOSITE ----------
  const compositeScore = clamp(
    svcScore * 0.35 +
    loanRiskScore * 0.30 +
    stabilityScore * 0.20 +
    liquidityScore * 0.10 +
    channelScore * 0.05
  );

  // ---------- OUTPUT ----------
  return {
    scoring_model_version: SCORING_MODEL_VERSION,

    svc_score: svcScore,
    loan_risk_score: loanRiskScore,
    stability_score: stabilityScore,
    liquidity_score: liquidityScore,
    channel_score: channelScore,
    composite_score: compositeScore,

    income_mid: incomeMid,
    housing_payment_mid: housingMid,
    debt_repayment_mid: debtMid,
    liquid_assets_mid: liquidMid,
    loan_amount_mid: loanAmountMid,
    deposit_percent_mid: depositMid,
    vehicle_age_mid: vehicleAgeMid,
    loan_term_months: loanTermMonths
  };
}
