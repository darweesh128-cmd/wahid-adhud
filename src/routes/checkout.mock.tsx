import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/checkout/mock")({
  beforeLoad: () => {
    throw redirect({ to: "/join" });
  },
});
