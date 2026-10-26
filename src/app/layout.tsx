import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Noto_Sans_Bengali } from "next/font/google";
import { SiteHeader } from "@/components/SiteHeader";
import "./globals.css";

const latin = Geist({ variable: "--font-latin", subsets: ["latin"] });
const bengali = Noto_Sans_Bengali({ variable: "--font-bengali", subsets: ["bengali"] });
const mono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Book Catalogue", template: "%s · Book Catalogue" },
  description: "Eftakher's personal library — Bangla and English books.",
  appleWebApp: { capable: true, title: "Books", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  // Draw under the notch / home indicator; the header and sticky bars pad with safe-area insets
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${latin.variable} ${bengali.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <SiteHeader />
        <main className="mx-auto w-full max-w-6xl flex-1 px-[max(1rem,env(safe-area-inset-left))] py-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:py-6">{children}</main>
      </body>
    </html>
  );
}
