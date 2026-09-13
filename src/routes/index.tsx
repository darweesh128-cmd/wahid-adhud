import { createFileRoute } from "@tanstack/react-router";
import { HomePage } from "@/components/adhud/home-page";
import { SEO } from "@/lib/adhud/content";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: SEO.title },
      { name: "description", content: SEO.description },
      { property: "og:title", content: SEO.title },
      { property: "og:description", content: SEO.description },
      { name: "keywords", content: SEO.keywords },
    ],
  }),
  component: HomePage,
});
