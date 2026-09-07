import { createFileRoute } from "@tanstack/react-router";
import { handleSubyWebhook } from "@/lib/suby-checkout";

export const Route = createFileRoute("/api/suby/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const rawBody = await request.text();
        return handleSubyWebhook(rawBody, {
          signature: request.headers.get("x-webhook-signature"),
          timestamp: request.headers.get("x-webhook-timestamp"),
          event: request.headers.get("x-webhook-event"),
        });
      },
    },
  },
});
