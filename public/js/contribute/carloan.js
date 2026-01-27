// public/js/contribute/carloan.js
document.addEventListener("DOMContentLoaded", () => {
const form = document.getElementById("loanForm");
if (!form) return;

  // rest of the file
});

document.addEventListener("DOMContentLoaded", () => {
// Guard: only run on contribute car loan page
if (!document.getElementById("loanForm")) return;

const form = document.getElementById("loanForm");

const housing = document.getElementById("housingStatus");
const rentField = document.getElementById("rentField");
const mortgageField = document.getElementById("mortgageField");

/* ==============================
    Housing conditional logic
 ============================== */

function syncHousing() {
const v = housing.value;

if (rentField) {
rentField.classList.toggle("hidden", v !== "renting");
}

if (mortgageField) {
mortgageField.classList.toggle("hidden", v !== "owner_mortgage");
}
}

housing?.addEventListener("change", syncHousing);
syncHousing();

/* ==============================
    Submit logic
 ============================== */

form.addEventListener("submit", async (e) => {
e.preventDefault();

const payload = {
lender: form.lender.value,
interestRate: Number(form.interestRate.value),

state: form.state.value,
applicationChannel: form.applicationChannel.value,

incomeBand: form.incomeBand.value,
employmentStatus: form.employmentStatus.value,
ageBand: form.ageBand.value,
housingStatus: form.housingStatus.value,
rentPaymentBand: form.rentPaymentBand?.value || null,
mortgagePaymentBand: form.mortgagePaymentBand?.value || null,
dependents: form.dependents.value,
monthlyDebtRepaymentsBand: form.monthlyDebtRepaymentsBand.value,
liquidAssetsBand: form.liquidAssetsBand.value,

loanAmountBand: form.loanAmountBand.value,
loanPurpose: form.loanPurpose.value,
loanTermMonths: form.loanTermMonths.value,
guarantor: form.guarantor.value,
depositPercentBand: form.depositPercentBand.value,
vehicleAgeBand: form.vehicleAgeBand.value
};

try {
// Step 1: submit JSON
const res = await fetch("/api/submit-car-loan", {
method: "POST",
headers: { "Content-Type": "application/json" },
body: JSON.stringify(payload)
});

if (!res.ok) {
alert("Submit failed: " + await res.text());
return;
}

const data = await res.json();
const id = Number(data.id);

// Step 2: upload PDF (optional)
const pdf = form.evidencePdf?.files?.[0];
if (pdf) {
const fd = new FormData();
fd.append("id", String(id));
fd.append("file", pdf);

const up = await fetch("/api/upload-evidence", {
method: "POST",
body: fd
});

if (!up.ok) {
alert("Submitted, but PDF upload failed: " + await up.text());
return;
}
}

alert("Submitted successfully");
form.reset();
syncHousing();

} catch (err) {
console.error(err);
alert("Network error");
}
});
});
  });
