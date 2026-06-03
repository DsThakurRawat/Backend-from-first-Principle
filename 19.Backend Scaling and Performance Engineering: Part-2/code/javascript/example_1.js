// Edge authentication — runs in 2–3ms at the closest CDN node
export default {
  async fetch(request, env) {
    const sessionId = getCookie(request, "session_id");

    if (!sessionId) {
      return new Response("Unauthorized", { status: 401 });
    }

    // Check session in edge KV store (global, low-latency)
    const userId = await env.SESSIONS.get(sessionId);
    if (!userId) {
      return new Response("Unauthorized", { status: 401 });
    }

    // Authenticated → forward to origin server
    request.headers.set("X-User-Id", userId);
    return fetch(request);
  },
};
