import { createFileRoute } from "@tanstack/react-router";
import { JoinPage } from "@/components/adhud/join-page";

export const Route = createFileRoute("/join")({
  head: () => ({
    meta: [
      { title: "انضم · عَضُد" },
      {
        name: "description",
        content: "طلب انضمام للدائرة المغلقة — بلا طرح عام وبلا وعد بأرباح. مرحلة التأسيس وفق المادة ٦٢.",
      },
      { name: "robots", content: "noindex, follow" },
    ],
  }),
  component: JoinPage,
});
