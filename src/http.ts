// Tiny Bun HTTP server for health/readiness checks
export function startHttpServer(getState?: () => Record<string, unknown>) {
  const port = Number(process.env.PORT || 8080);
  const startedAt = Date.now();

  Bun.serve({
    port,
    // No TLS for a simple health port; keep it minimal
    fetch(req) {
      const url = new URL(req.url);

      if (url.pathname === "/health") {
        const body = {
          ok: true,
          uptimeSec: Math.round((Date.now() - startedAt) / 1000),
          env: {
            botToken: Boolean(process.env.BOT_TOKEN),
            geminiKey: Boolean(process.env.GEMINI_API_KEY),
            cmcKey: Boolean(process.env.CMC_API_KEY),
          },
          ...(getState ? getState() : {}),
        };
        return new Response(JSON.stringify(body), {
          headers: { "content-type": "application/json" },
          status: 200,
        });
      }

      // Optional: basic root
      if (url.pathname === "/") {
        return new Response("telegoat-bot: ok", { status: 200 });
      }

      return new Response("not found", { status: 404 });
    },
  });

  console.log(`HTTP health server listening on :${port}`);
}