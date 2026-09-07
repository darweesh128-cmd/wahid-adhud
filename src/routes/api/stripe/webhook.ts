import { createFileRoute } from "@tanstack/react-router";
import { handleStripeWebhook } from "@/lib/stripe-checkout";

export const Route = createFileRoute("/api/stripe/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const signature = request.headers.get("stripe-signature");
        const rawBody = await request.text();
        return handleStripeWebhook(rawBody, signature);
      },
    },
  },
});
