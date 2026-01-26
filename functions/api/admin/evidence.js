export async function onRequest(context) {
  const { request, env } = context;

  // Admin auth
  const key = request.headers.get("x-admin-key");
  if (!key || key !== env.ADMIN_KEY) {
    return new Response("Unauthorized", { status: 401 });
  }

  const url = new URL(request.url);
  const objectKey = url.searchParams.get("key");

  if (!objectKey) {
    return new Response("Missing key", { status: 400 });
  }

  let obj;
  try {
    obj = await env.EVIDENCE.get(objectKey);
  } catch (err) {
    console.error("R2 get failed:", err);
    return new Response("Failed to read PDF", { status: 500 });
  }

  if (!obj) {
    return new Response("PDF not found", { status: 404 });
  }

  return new Response(obj.body, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": "inline",
      "Cache-Control": "no-store"
    }
  });
}
