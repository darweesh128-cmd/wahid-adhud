import { createFileRoute } from "@tanstack/react-router";
import { GovernancePage } from "@/components/adhud/governance-page";

export const Route = createFileRoute("/governance")({
  head: () => ({
    meta: [
      { title: "الحوكمة · عَضُد" },
      {
        name: "description",
        content: "قيود المؤسس، التقارير، المواد الحصينة، المحظورات المطلقة، ومسار التقنين.",
      },
    ],
  }),
  component: GovernancePage,
});
