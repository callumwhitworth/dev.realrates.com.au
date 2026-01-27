export async function onRequest(context) {
  const { request, env } = context;

  if (request.method !== "POST") return new Response("Method Not Allowed", { status: 405 });

  const ct = request.headers.get("content-type") || "";
  if (!ct.includes("multipart/form-data")) {
    return new Response("Expected multipart/form-data", { status: 415 });
  }

  try {
    const form = await request.formData();

    const idRaw = form.get("id");
    const id = Number(idRaw);
    if (!Number.isInteger(id) || id <= 0) return new Response("Invalid id", { status: 400 });

    const file = form.get("file");
    if (!file || typeof file !== "object") return new Response("Missing file", { status: 400 });

    // Workers File/Blob-like object checks
    const name = String(file.name || "evidence.pdf");
    const type = String(file.type || "");
    const size = Number(file.size || 0);

    const isPdf = type === "application/pdf" || name.toLowerCase().endsWith(".pdf");
    if (!isPdf) return new Response("File must be a PDF", { status: 400 });

    if (!Number.isFinite(size) || size <= 0) return new Response("Empty file", { status: 400 });
    if (size > 10 * 1024 * 1024) return new Response("PDF too large (max 10MB)", { status: 400 });

    const safeName = name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const key = `unverified/${id}/${Date.now()}_${safeName}`;

    // Use arrayBuffer (more compatible than stream())
    const buf = await file.arrayBuffer();
    await env.EVIDENCE.put(key, buf, { httpMetadata: { contentType: "application/pdf" } });

    await env.DB.prepare(`
      UPDATE unverified_car_loans
      SET evidence_pdf_key = ?, evidence_pdf_uploaded_at = CURRENT_TIMESTAMP, evidence_pdf_size = ?
      WHERE id = ?
    `).bind(key, size, id).run();

    return new Response(JSON.stringify({ ok: true, key }), {
      headers: { "content-type": "application/json", "cache-control": "no-store" }
    });

  } catch (err) {
    return new Response("Server error: " + (err?.message || String(err)), { status: 500 });
  }
}
