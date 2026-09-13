import { createFileRoute } from "@tanstack/react-router";
import { CraftsmanPage } from "@/components/adhud/craftsman-page";

export const Route = createFileRoute("/craftsman")({
  head: () => ({
    meta: [
      { title: "للحِرفيّ · عَضُد" },
      {
        name: "description",
        content: "مسار الحِرفيّ في عَضُد: استكشاف، تمويل مشاركة متناقصة، مرافقة، وأيلولة الملكية خلال سبع سنوات.",
      },
    ],
  }),
  component: CraftsmanPage,
});
