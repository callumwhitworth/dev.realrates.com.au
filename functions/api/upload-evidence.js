export async function onRequest(context) {
  const { request, env } = context;

  if (request.method !== "POST") return new Response("Method Not Allowed", { status: 405 });

  const ct = request.headers.get("content-type") || "";
  if (!ct.includes("multipart/form-data")) return new Response("Expected multipart/form-data", { status: 415 });

  const form = await request.formData();
  const id = Number(form.get("id"));
  const file = form.get("file");

  if (!Number.isInteger(id) || id <= 0) return new Response("Invalid id", { status: 400 });
  if (!(file instanceof File)) return new Response("Missing file", { status: 400 });

  // Validate PDF + size (10MB cap)
  const isPdf = file.type === "application/pdf" || String(file.name || "").toLowerCase().endsWith(".pdf");
  if (!isPdf) return new Response("File must be a PDF", { status: 400 });
  if (file.size > 10 * 1024 * 1024) return new Response("PDF too large (max 10MB)", { status: 400 });

  // Key: unverified/<id>/<timestamp>.pdf
  const safeName = String(file.name || "evidence.pdf").replace(/[^a-zA-Z0-9._-]/g, "_");
  const key = `unverified/${id}/${Date.now()}_${safeName}`;

  // Upload to R2
  await env.EVIDENCE.put(key, file.stream(), {
    httpMetadata: { contentType: "application/pdf" }
  }); // R2 bucket put() usage :contentReference[oaicite:2]{index=2}

  // Persist key on the unverified row
  await env.DB.prepare(`
    UPDATE unverified_car_loans
    SET evidence_pdf_key = ?, evidence_pdf_uploaded_at = CURRENT_TIMESTAMP, evidence_pdf_size = ?
    WHERE id = ?
  `).bind(key, file.size, id).run();

  return new Response(JSON.stringify({ ok: true, key }), {
    headers: { "content-type": "application/json", "cache-control": "no-store" }
  });
}
