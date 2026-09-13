import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/member/$username")({
  beforeLoad: () => {
    throw redirect({ to: "/" });
  },
});
