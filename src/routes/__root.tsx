import { useState } from "react";
import {
  createRootRoute,
  HeadContent,
  notFound,
  Outlet,
  Scripts,
} from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { AuthProvider } from "@/lib/auth/provider";
import { isPublicHidden } from "@/lib/public-hidden";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import { SEO } from "@/lib/adhud/content";
import appCss from "../styles.css?url";

const HIDDEN_HEAD = {
  meta: [
    { charSet: "utf-8" },
    { name: "viewport", content: "width=device-width, initial-scale=1" },
    { title: "Unavailable" },
    { name: "robots", content: "noindex, nofollow, noarchive" },
    { name: "googlebot", content: "noindex, nofollow, noarchive" },
    { name: "theme-color", content: "#000000" },
  ],
  links: [{ rel: "stylesheet", href: appCss }],
};

export const Route = createRootRoute({
  beforeLoad: ({ location }) => {
    if (!isPublicHidden()) return;
    const path = location.pathname;
    if (path === "/robots.txt" || path === "/sitemap.xml") return;
    throw notFound();
  },
  head: () =>
    isPublicHidden()
      ? HIDDEN_HEAD
      : {
          meta: [
            { charSet: "utf-8" },
            { name: "viewport", content: "width=device-width, initial-scale=1" },
            { title: SEO.title },
            { name: "description", content: SEO.description },
            { name: "theme-color", content: "#e4ebe6" },
            { property: "og:title", content: SEO.title },
            { property: "og:description", content: SEO.description },
            { property: "og:type", content: "website" },
            { property: "og:locale", content: "ar_SA" },
            { name: "twitter:card", content: "summary_large_image" },
            { name: "twitter:title", content: SEO.title },
            { name: "twitter:description", content: SEO.description },
            { name: "keywords", content: SEO.keywords },
          ],
          links: [
            { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
            { rel: "stylesheet", href: appCss },
            { rel: "manifest", href: "/__grok/manifest.webmanifest" },
            { rel: "apple-touch-icon", href: "/__grok/icon-180.png" },
            { rel: "preconnect", href: "https://fonts.googleapis.com" },
            {
              rel: "preconnect",
              href: "https://fonts.gstatic.com",
              crossOrigin: "anonymous",
            },
            {
              rel: "stylesheet",
              href: "https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400&family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap",
            },
          ],
        },
  notFoundComponent: NotFound,
  component: RootDocument,
});

function NotFound() {
  if (isPublicHidden()) return <main className="min-h-screen bg-black" />;
  return (
    <main
      className="flex min-h-screen items-center justify-center bg-bg text-fg-muted"
      dir="rtl"
      lang="ar"
    >
      <p>الصفحة غير موجودة</p>
    </main>
  );
}

function RootDocument() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 8_000,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  if (isPublicHidden()) {
    return (
      <html lang="ar" dir="rtl" suppressHydrationWarning>
        <head>
          <HeadContent />
        </head>
        <body className="bg-black text-black">
          <Outlet />
          <Scripts />
        </body>
      </html>
    );
  }

  return (
    <html lang="ar" dir="rtl" className="antialiased" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="bg-bg text-fg">
        <PreviewHostBridge />
        <AuthProvider>
          <QueryClientProvider client={queryClient}>
            <Outlet />
            <Toaster
              theme="light"
              position="top-center"
              dir="rtl"
              toastOptions={{
                className:
                  "!bg-surface !text-fg !border-border !font-[family-name:var(--font-sans)]",
              }}
            />
          </QueryClientProvider>
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  );
}
