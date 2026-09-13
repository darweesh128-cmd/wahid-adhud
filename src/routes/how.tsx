import { createFileRoute } from "@tanstack/react-router";
import { HowPage } from "@/components/adhud/how-page";

export const Route = createFileRoute("/how")({
  head: () => ({
    meta: [
      { title: "كيف يعمل · عَضُد" },
      {
        name: "description",
        content: "المشاركة المتناقصة، سقف الأيلولة، شلّال التوزيع، ومراحل الإطلاق وفق دستور عَضُد.",
      },
    ],
  }),
  component: HowPage,
});
