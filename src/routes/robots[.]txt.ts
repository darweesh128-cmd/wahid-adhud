import { createFileRoute } from "@tanstack/react-router";

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
        const body = [
          "User-agent: *",
          "Allow: /",
          "",
          `Sitemap: ${origin}/sitemap.xml`,
          "",
          "# LLM / agent context",
          `See: ${origin}/llms.txt`,
          "",
        ].join("\n");
        return new Response(body, {
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        });
      },
    },
  },
});
