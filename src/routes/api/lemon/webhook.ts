import { createFileRoute } from "@tanstack/react-router";
import { handleLemonWebhook } from "@/lib/lemon-checkout";

export const Route = createFileRoute("/api/lemon/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const signature = request.headers.get("X-Signature");
        const rawBody = await request.text();
        return handleLemonWebhook(rawBody, signature);
      },
    },
  },
});
