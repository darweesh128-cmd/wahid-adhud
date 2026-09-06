import { useState } from "react";
import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { AuthProvider } from "@/lib/auth/provider";
import { I18nProvider, useI18n } from "@/lib/i18n";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import appCss from "../styles.css?url";

const APP_NAME = "واحد · عائلة العضد";
const APP_DESCRIPTION_AR =
  "انضم بـ 5 USDT على TRC-20. عائلة العضد — مساعدة متبادلة بلا حساب ولا KYC. محفظتك هي هويتك.";
const APP_DESCRIPTION_EN =
  "Join with 5 USDT on TRC-20. Wahid · The ʿAḍud — wallet-level mutual aid. No account. No KYC.";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: `${APP_NAME} · 5 USDT TRC-20` },
      { name: "description", content: APP_DESCRIPTION_AR },
      { name: "theme-color", content: "#090B0A" },
      { property: "og:title", content: `${APP_NAME} · انضم بـ 5 USDT` },
      { property: "og:description", content: APP_DESCRIPTION_AR },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: `${APP_NAME} · 5 USDT mutual aid` },
      { name: "twitter:description", content: APP_DESCRIPTION_EN },
      { name: "keywords", content: "Wahid, Adhud, 5 USDT, TRC-20, mutual aid, عائلة العضد, مساعدة متبادلة" },
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
  }),
  component: RootDocument,
});

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

  return (
    <html lang="ar" dir="rtl" className="antialiased" suppressHydrationWarning>
      <head>
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
  const { dir } = useI18n();
  return (
    <Toaster
      theme="dark"
      position="top-center"
      dir={dir}
      toastOptions={{
        className: "!bg-surface !text-fg !border-border !font-[family-name:var(--font-sans)]",
      }}
    />
  );
}
