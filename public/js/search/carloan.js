document.addEventListener("DOMContentLoaded", () => {
  const housing = document.getElementById("housingStatus");
  const rentField = document.getElementById("rentField");
  const mortgageField = document.getElementById("mortgageField");
  const form = document.getElementById("searchForm");

  function syncHousing() {
    rentField.classList.toggle("hidden", housing.value !== "renting");
    mortgageField.classList.toggle("hidden", housing.value !== "owner_mortgage");
  }

  housing.addEventListener("change", syncHousing);
  syncHousing();

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const payload = Object.fromEntries(new FormData(form));

    const params = new URLSearchParams(payload).toString();
    window.location.href = `/searchresultscarloan?${params}`;
  });
});
