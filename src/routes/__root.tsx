import { useState } from "react";
import { createRootRoute, HeadContent, notFound, Outlet, Scripts } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { AuthProvider } from "@/lib/auth/provider";
import { I18nProvider, LANG_BOOTSTRAP_SCRIPT } from "@/lib/i18n";
import { isPublicHidden } from "@/lib/public-hidden";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import appCss from "../styles.css?url";

const APP_NAME = "Wahid · The ʿAḍud";
const APP_DESCRIPTION_EN =
  "Open your account with Wahid · The ʿAḍud — a $1 membership built on mutual solidarity and trust. Join ʿAḍīd who stand as someone's arm.";

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
            { title: `${APP_NAME} · Open account · $1 membership` },
            { name: "description", content: APP_DESCRIPTION_EN },
            { name: "theme-color", content: "#090B0A" },
            { property: "og:title", content: `${APP_NAME} · Open account` },
            { property: "og:description", content: APP_DESCRIPTION_EN },
            { property: "og:type", content: "website" },
            { name: "twitter:card", content: "summary_large_image" },
            { name: "twitter:title", content: `${APP_NAME} · $1 mutual solidarity` },
            { name: "twitter:description", content: APP_DESCRIPTION_EN },
            {
              name: "keywords",
              content: "Wahid, Adhud, Open account, $1 membership, mutual solidarity, mutual aid, trust, ʿAḍud",
            },
          ],
          links: [
            { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
            { rel: "stylesheet", href: appCss },
            { rel: "manifest", href: "/__grok/manifest.webmanifest" },
            { rel: "apple-touch-icon", href: "/__grok/icon-180.png" },
            { rel: "preconnect", href: "https://fonts.googleapis.com" },
            { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
            {
              rel: "stylesheet",
              href: "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&display=swap",
            },
          ],
        },
  notFoundComponent: HiddenNotFound,
  component: RootDocument,
});

function HiddenNotFound() {
  if (isPublicHidden()) return <main className="min-h-screen bg-black" />;
  return (
    <main className="flex min-h-screen items-center justify-center bg-black text-neutral-500">
      <p>Not found</p>
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
      <html lang="en" dir="ltr" suppressHydrationWarning>
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
    <html lang="en" dir="ltr" className="antialiased" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: LANG_BOOTSTRAP_SCRIPT }} />
        <HeadContent />
      </head>
      <body className="bg-bg text-fg">
        <PreviewHostBridge />
        <AuthProvider>
          <I18nProvider>
            <QueryClientProvider client={queryClient}>
              <Outlet />
              <AppToaster />
            </QueryClientProvider>
          </I18nProvider>
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  );
}

function AppToaster() {
  return (
    <Toaster
      theme="dark"
      position="top-center"
      dir="ltr"
      toastOptions={{
        className: "!bg-surface !text-fg !border-border !font-[family-name:var(--font-sans)]",
      }}
    />
  );
}
