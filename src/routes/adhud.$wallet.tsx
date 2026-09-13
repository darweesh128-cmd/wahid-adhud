import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/adhud/$wallet")({
  beforeLoad: () => {
    throw redirect({ to: "/" });
  },
});
