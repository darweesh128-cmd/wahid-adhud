import { createFileRoute } from "@tanstack/react-router";
import { ParticipantPage } from "@/components/adhud/participant-page";

export const Route = createFileRoute("/participant")({
  head: () => ({
    meta: [
      { title: "للمشارك · عَضُد" },
      {
        name: "description",
        content: "أنواع المساهمة ووحدات ونقاط عَضُد وشلّال التوزيع — بلا ضمان ربح وبلا حق إدارة في المنصّة.",
      },
    ],
  }),
  component: ParticipantPage,
});
