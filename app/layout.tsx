import "@/styles/globals.css";
import { Metadata, Viewport } from "next";
import clsx from "clsx";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

import { Providers } from "./providers";

import { siteConfig } from "@/config/site";
import { fontSans } from "@/config/fonts";
import { Navbar } from "@/components/navbar";
import { getSiteSettings } from "@/lib/site-settings";

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s - ${siteConfig.name}`,
  },
  description: siteConfig.description,
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  themeColor: { color: "white" },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const siteSettings = await getSiteSettings();
  const footerText =
    siteSettings.footerText ||
    `${siteSettings.siteName || siteConfig.name} · Powered by HeroUI`;

  return (
    <html suppressHydrationWarning className="light" lang="en">
      <head>
        <link href={siteSettings.faviconUrl ?? "/favicon.ico"} rel="icon" />
      </head>
      <body
        className={clsx(
          "min-h-screen text-foreground bg-background font-sans antialiased",
          fontSans.variable,
        )}
        style={{ backgroundColor: siteSettings.backgroundColor }}
      >
        <Providers
          themeProps={{
            attribute: "class",
            defaultTheme: "light",
            forcedTheme: "light",
          }}
        >
          <div className="relative flex h-screen flex-col">
            <Navbar
              logoUrl={siteSettings.logoUrl}
              siteName={siteSettings.siteName}
            />
            <main
              className="mx-auto flex w-full flex-grow items-center justify-center"
              style={{ maxWidth: "100%" }}
            >
              {children}
            </main>
            <footer className="flex w-full items-center justify-center py-3 border-t border-default-200">
              <span className="text-default-500 text-sm">{footerText}</span>
            </footer>
          </div>
        </Providers>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
