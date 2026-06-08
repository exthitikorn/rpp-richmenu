import "@/styles/globals.css";
import { Metadata, Viewport } from "next";
import clsx from "clsx";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

import { Providers } from "./providers";

import { siteConfig } from "@/config/site";
import { fontSans } from "@/config/fonts";
import { Navbar } from "@/components/navbar";

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
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: { color: "white" },
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const footerText = `ฝ่ายวิชาการและแผนงาน โรงพยาบาลราชพิพัฒน์`;

  return (
    <html suppressHydrationWarning className="light" lang="th">
      <body
        className={clsx(
          "min-h-screen text-foreground bg-background font-sans antialiased",
          fontSans.variable,
        )}
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-4 focus:inline-flex focus:items-center focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground focus:shadow-lg"
        >
          ข้ามไปยังเนื้อหาหลัก
        </a>
        <Providers
          themeProps={{
            attribute: "class",
            defaultTheme: "light",
            forcedTheme: "light",
          }}
        >
          <div className="relative flex h-screen flex-col">
            <Navbar />
            <main
              id="main-content"
              className="mx-auto flex w-full flex-grow"
              style={{ maxWidth: "100%" }}
            >
              {children}
            </main>
            <footer
              className="flex w-full items-center justify-center py-3 border-t border-default-200"
              style={{
                paddingBottom:
                  "calc(0.75rem + env(safe-area-inset-bottom, 0px))",
              }}
            >
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
