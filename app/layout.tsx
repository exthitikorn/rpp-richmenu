import "@/styles/globals.css";
import { Metadata, Viewport } from "next";
import clsx from "clsx";

import { Providers } from "./providers";

import { siteConfig, getFooterText } from "@/config/site";
import { fontSans } from "@/config/fonts";
import { logoImage } from "@/components/icons";

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s - ${siteConfig.name}`,
  },
  description: siteConfig.description,
  icons: {
    icon: logoImage.src,
    apple: logoImage.src,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: { color: siteConfig.colors.primary },
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html suppressHydrationWarning className="light" lang="th">
      <body
        className={clsx(
          "min-h-screen text-foreground bg-background font-sans antialiased",
          fontSans.variable,
        )}
      >
        <a
          className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-4 focus:inline-flex focus:items-center focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground focus:shadow-lg"
          href="#main-content"
        >
          ข้ามไปยังเนื้อหาหลัก
        </a>
        <Providers>
          <div className="relative flex h-screen flex-col">
            <main
              className="mx-auto flex w-full flex-grow flex-col"
              id="main-content"
              style={{ maxWidth: "100%" }}
            >
              {children}
            </main>
            <footer
              className="flex w-full items-center justify-center border-t border-default-200 py-3"
              style={{
                paddingBottom:
                  "calc(0.75rem + env(safe-area-inset-bottom, 0px))",
              }}
            >
              <span className="text-sm text-default-500">
                {getFooterText()}
              </span>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}
