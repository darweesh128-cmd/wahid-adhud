import { createFileRoute } from "@tanstack/react-router";
import { isPublicHidden } from "@/lib/public-hidden";

const STATIC_PATHS = ["/", "/network"] as const;

function siteOrigin(request: Request): string {
  try {
    return new URL(request.url).origin;
  } catch {
    return "";
  }
}

function xmlEscape(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: ({ request }) => {
        if (isPublicHidden()) {
          const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
</urlset>`;
          return new Response(body, {
            headers: {
              "Content-Type": "application/xml; charset=utf-8",
              "X-Robots-Tag": "noindex, nofollow, noarchive",
            },
          });
        }
        const origin = siteOrigin(request);
        const today = new Date().toISOString().slice(0, 10);
        const urls = STATIC_PATHS.map(
          (path) => `  <url>
    <loc>${xmlEscape(`${origin}${path}`)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>${path === "/" ? "1.0" : "0.8"}</priority>
  </url>`,
        );
        const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;
        return new Response(body, {
          headers: { "Content-Type": "application/xml; charset=utf-8" },
        });
      },
    },
  },
});
