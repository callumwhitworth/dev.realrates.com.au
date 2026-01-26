export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  const token = url.searchParams.get("token");
  const keyParam = url.searchParams.get("key");

  // A) token -> stream PDF (NO x-admin-key required)
  if (token) {
    const [objectKey, expires, sig] = token.split("|");

    if (!objectKey || !expires || !sig) {
      return new Response("Invalid token", { status: 400 });
    }
    if (Date.now() > Number(expires)) {
      return new Response("Token expired", { status: 401 });
    }

    const expectedSig = await hmac(env.ADMIN_KEY, `${objectKey}|${expires}`);
    if (sig !== expectedSig) {
      return new Response("Invalid signature", { status: 401 });
    }

    const obj = await env.EVIDENCE.get(objectKey);
    if (!obj) return new Response("PDF not found", { status: 404 });

    return new Response(obj.body, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline",
        "Cache-Control": "no-store",
      },
    });
  }

  // B) key -> mint token (x-admin-key REQUIRED)
  if (keyParam) {
    const adminKey = request.headers.get("x-admin-key");
    if (!adminKey || adminKey !== env.ADMIN_KEY) {
      return new Response("Unauthorized", { status: 401 });
    }

    const expires = Date.now() + 5 * 60 * 1000; // 5 min
    const sig = await hmac(env.ADMIN_KEY, `${keyParam}|${expires}`);

    return Response.json({
      ok: true,
      token: `${keyParam}|${expires}|${sig}`,
    });
  }

  return new Response("Bad request (missing key or token)", { status: 400 });
}

async function hmac(secret, msg) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(msg));
  return [...new Uint8Array(sig)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
