<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="robots" content="noindex,nofollow" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Search Car Loan Rates – RealRates</title>

  <link rel="stylesheet" href="/css/base.css" />
</head>

<body class="page-search">

  <!-- NAV BAR -->
  <nav class="navbar">
    <div class="navbar-inner">
      <div class="nav-left">
        <img src="/css/RealRatesLogo.png" alt="RealRates logo" class="nav-logo" />
        <div class="nav-brand">
          <div class="nav-brand-title">
            RealRates<span>.com.au</span>
          </div>
          <div class="nav-brand-tagline">
            Because “from 6.99%” means nothing
          </div>
        </div>
      </div>

      <div class="nav-right">
        <a href="/">Home</a>
        <a href="/logout">Sign Out</a>
      </div>
    </div>
  </nav>

  <!-- MAIN CONTENT -->
  <main>
    <div class="page-container">
      <div class="form-column">

        <h1>Search real car loan rates</h1>
        <p class="muted">
          Answer the same questions lenders ask to see what people like you actually paid.
        </p>

        <form id="searchForm">

          <!-- Location + channel -->
          <div class="row">
            <label>
              State
              <select name="state" required>
                <option>VIC</option><option>NSW</option><option>QLD</option>
                <option>SA</option><option>WA</option><option>TAS</option>
                <option>ACT</option><option>NT</option>
              </select>
            </label>

            <label>
              Application channel
              <select name="applicationChannel" required>
                <option value="online">Online</option>
                <option value="branch">Branch</option>
                <option value="broker">Broker</option>
                <option value="dealer">Dealer</option>
              </select>
            </label>
          </div>

          <label>
            Income (gross, excl. super)
            <select name="incomeBand" required>
              <option value="lt_40000">&lt; $40k</option>
              <option value="40000-49999">$40k–49,999</option>
              <option value="50000-59999">$50k–59,999</option>
              <option value="60000-69999">$60k–69,999</option>
              <option value="70000-79999">$70k–79,999</option>
              <option value="80000-89999">$80k–89,999</option>
              <option value="90000-99999">$90k–99,999</option>
              <option value="100000-109999">$100k–109,999</option>
              <option value="110000-119999">$110k–119,999</option>
              <option value="120000_plus">$120k+</option>
            </select>
          </label>

          <label>
            Employment status / stability
            <select name="employmentStatus" required>
              <option value="permanent_full_time">Full-time (1+ year)</option>
              <option value="permanent_part_time">Part-time</option>
              <option value="casual">Casual</option>
              <option value="contract">Contract</option>
              <option value="self_employed">Self-employed</option>
              <option value="unemployed">Unemployed</option>
            </select>
          </label>

          <label>
            Age band
            <select name="ageBand" required>
              <option value="18-24">18–24</option>
              <option value="25-34">25–34</option>
              <option value="35-44">35–44</option>
              <option value="45-54">45–54</option>
              <option value="55-64">55–64</option>
              <option value="65_plus">65+</option>
            </select>
          </label>

          <label>
            Housing status
            <select name="housingStatus" id="housingStatus" required>
              <option value="owner_mortgage">Owner (mortgage)</option>
              <option value="owner_outright">Owner (outright)</option>
              <option value="renting">Renting</option>
              <option value="living_with_family">Living with family</option>
            </select>
          </label>

          <label id="mortgageField">
            Monthly mortgage repayment (band)
            <select name="mortgagePaymentBand">
              <option value="lt_1000">&lt; $1,000</option>
              <option value="1000-1999">$1,000–1,999</option>
              <option value="2000-2999">$2,000–2,999</option>
              <option value="3000_plus">$3,000+</option>
            </select>
          </label>

          <label id="rentField" class="hidden">
            Monthly rent (band)
            <select name="rentPaymentBand">
              <option value="lt_1000">&lt; $1,000</option>
              <option value="1000-1999">$1,000–1,999</option>
              <option value="2000-2999">$2,000–2,999</option>
              <option value="3000_plus">$3,000+</option>
            </select>
          </label>

          <label>
            Dependents
            <select name="dependents" required>
              <option value="0">0</option><option value="1">1</option>
              <option value="2">2</option><option value="3">3</option>
              <option value="4">4+</option>
            </select>
          </label>

          <label>
            Existing debt obligations (monthly)
            <select name="monthlyDebtRepaymentsBand" required>
              <option value="0">$0</option>
              <option value="lt_500">&lt; $500</option>
              <option value="500-999">$500–999</option>
              <option value="1000_plus">$1,000+</option>
            </select>
          </label>

          <label>
            Savings / liquid assets
            <select name="liquidAssetsBand" required>
              <option value="lt_1000">&lt; $1,000</option>
              <option value="1000-4999">$1,000–4,999</option>
              <option value="5000-19999">$5,000–19,999</option>
              <option value="20000_plus">$20,000+</option>
            </select>
          </label>

          <label>
            Loan amount
            <select name="loanAmountBand" required>
              <option value="lt_5000">&lt; $5,000</option>
              <option value="5000-9999">$5,000–9,999</option>
              <option value="10000-19999">$10,000–19,999</option>
              <option value="20000-29999">$20,000–29,999</option>
              <option value="30000_plus">$30,000+</option>
            </select>
          </label>

          <label>
            Loan purpose
            <select name="loanPurpose" required>
              <option value="car_new">Car – new</option>
              <option value="car_used">Car – used</option>
            </select>
          </label>

          <label>
            Loan term (months)
            <select name="loanTermMonths" required>
              <option value="12">12</option>
              <option value="24">24</option>
              <option value="36">36</option>
              <option value="48">48</option>
              <option value="60">60</option>
              <option value="72">72</option>
            </select>
          </label>

          <div class="row">
            <label>
              Guarantor
              <select name="guarantor" required>
                <option value="none">None</option>
                <option value="parent">Parent</option>
                <option value="other">Other</option>
              </select>
            </label>

            <label>
              Deposit size (%)
              <select name="depositPercentBand" required>
                <option value="0">0%</option>
                <option value="5">5%</option>
                <option value="10">10%</option>
                <option value="20">20%+</option>
              </select>
            </label>
          </div>

          <label>
            Vehicle age
            <select name="vehicleAgeBand" required>
              <option value="new">New</option>
              <option value="lt_3">Under 3 years</option>
              <option value="3_5">3–5 years</option>
              <option value="gt_5">Over 5 years</option>
            </select>
          </label>

          <button type="submit">See real results</button>
        </form>

      </div>
    </div>
  </main>

  <!-- FOOTER -->
  <footer class="footer">
    <div class="footer-inner">
      <div class="footer-links">
        <a href="/about">About Us</a>
        <a href="/contact">Contact Us</a>
        <a href="/privacy">Privacy Policy</a>
      </div>
      <div class="footer-legal">
        RealRates.com.au ABN 67 951 208 922
      </div>
    </div>
  </footer>

  <!-- PAGE SCRIPT -->
  <script src="/js/search/carloan.js" defer></script>

</body>
</html>
