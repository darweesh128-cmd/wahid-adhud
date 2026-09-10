import { createFileRoute } from "@tanstack/react-router";
import { isPublicHidden } from "@/lib/public-hidden";

function siteOrigin(request: Request): string {
  try {
    return new URL(request.url).origin;
  } catch {
    return "";
  }
}

export const Route = createFileRoute("/robots.txt")({
  server: {
    handlers: {
      GET: ({ request }) => {
        const origin = siteOrigin(request);
        const body = isPublicHidden()
          ? ["User-agent: *", "Disallow: /", ""].join("\n")
          : ["User-agent: *", "Allow: /", "", `Sitemap: ${origin}/sitemap.xml`, ""].join("\n");
        return new Response(body, {
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        });
      },
    },
  },
});
