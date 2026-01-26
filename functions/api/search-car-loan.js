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
    // Ensure DB binding exists
    if (!env.DB) {
      return new Response(
        JSON.stringify({ error: "DB binding missing (env.DB is undefined)" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Parse JSON body safely
    let input;
    try {
      input = await request.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Light validation
    if (!input || typeof input !== "object" || Array.isArray(input) || Object.keys(input).length === 0) {
      return new Response(
        JSON.stringify({ error: "Empty search payload" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const sessionId = crypto.randomUUID();

    // Option A: store placeholders for score fields (schema requires NOT NULL)
    const stmt = env.DB.prepare(`
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
    `);

    const result = await stmt.bind(sessionId, JSON.stringify(input)).run();

    return new Response(
      JSON.stringify({
        ok: true,
        id: result?.meta?.last_row_id ?? null,
        session_id: sessionId,
        expires_in_days: 30,
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("search-car-loan error:", err);

    // Return useful error text for debugging (safe enough for internal dev)
    return new Response(
      JSON.stringify({
        error: err?.message || "Internal server error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
