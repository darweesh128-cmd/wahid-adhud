import { createFileRoute, redirect } from "@tanstack/react-router";

/** المسار القديم للشبكة — أُزيل من المنتج العام. */
export const Route = createFileRoute("/network")({
  beforeLoad: () => {
    throw redirect({ to: "/" });
  },
});
