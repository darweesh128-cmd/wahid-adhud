import { createFileRoute } from "@tanstack/react-router";
import { ConstitutionPage } from "@/components/adhud/constitution-page";

export const Route = createFileRoute("/constitution")({
  head: () => ({
    meta: [
      { title: "الدستور · عَضُد" },
      {
        name: "description",
        content: "الوثيقة التأسيسية الحاكمة لمشروع عَضُد — الأبواب والمواد الحصينة والمسرد.",
      },
    ],
  }),
  component: ConstitutionPage,
});
