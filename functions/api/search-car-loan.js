console.log("DB binding exists:", !!env.DB);
export async function onRequestPost({ request, env }) {
  try {
    // 1️⃣ Parse raw input
    const input = await request.json();

    // Basic sanity check (keep it light)
    if (!input || Object.keys(input).length === 0) {
      return new Response(
        JSON.stringify({ error: "Empty search payload" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 2️⃣ Generate a session ID (anonymous-safe)
    const sessionId = crypto.randomUUID();

    // 3️⃣ Insert RAW search data (no scoring)
await env.DB.prepare(`
  INSERT INTO customer_search_car_loan (
    session_id,
    expires_at,
    payment_status,
    search_input_json,
    search_score_json,
    scoring_model_version
  ) VALUES (
    ?,
    DATETIME('now', '+30 days'),
    'unpaid',
    ?,
    '{}',
    'pending'
  )
`)
.bind(
  sessionId,
  JSON.stringify(input)
)
.run();


    // 4️⃣ Respond with reference ID (important for next steps)
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
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
