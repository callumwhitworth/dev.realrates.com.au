export async function onRequest(context) {
  const { request, env } = context;

  // Admin guard
  const key = request.headers.get("x-admin-key");
  if (!key || key !== env.ADMIN_KEY) {
    return new Response("Unauthorized", { status: 401 });
  }

  const url = new URL(request.url);
  const objectKey = url.searchParams.get("key");

  if (!objectKey) {
    return new Response("Missing key", { status: 400 });
  }

  // Create a signed URL valid for 5 minutes
  const signedUrl = await env.EVIDENCE.createPresignedUrl(objectKey, {
    expiresIn: 60 * 5 // 5 minutes
  });

  return new Response(
    JSON.stringify({ ok: true, url: signedUrl }),
    { headers: { "content-type": "application/json", "cache-control": "no-store" } }
  );
}
