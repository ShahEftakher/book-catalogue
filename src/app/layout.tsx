import type { Metadata, Viewport } from "next";
import { EB_Garamond, Geist, Geist_Mono, Noto_Sans_Bengali, Noto_Serif_Bengali } from "next/font/google";
import { DaylightProvider } from "@/components/DaylightProvider";
import { SiteHeader } from "@/components/SiteHeader";
import { getDaylight, type Phase } from "@/lib/daylight";
import "./globals.css";

const latin = Geist({ variable: "--font-latin", subsets: ["latin"] });
const bengali = Noto_Sans_Bengali({ variable: "--font-bengali", subsets: ["bengali"] });
const mono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
// Serif pair for headings and gilt titles (parchment-and-ink theme)
const serif = EB_Garamond({ variable: "--font-serif-latin", subsets: ["latin"] });
const serifBengali = Noto_Serif_Bengali({ variable: "--font-serif-bengali", subsets: ["bengali"] });

// Browser chrome colour per time of day, matching --background in globals.css
const THEME_COLOR: Record<Phase, string> = {
  day: "#f4ead5",
  dawn: "#f3e2cf",
  dusk: "#ecd7bd",
  night: "#0f1424",
};

export const metadata: Metadata = {
  title: { default: "Book Catalogue", template: "%s · Book Catalogue" },
  description: "Eftakher's personal library — Bangla and English books.",
  appleWebApp: { capable: true, title: "Books", statusBarStyle: "default" },
};

export function generateViewport(): Viewport {
  return {
    themeColor: THEME_COLOR[getDaylight().phase],
    // Draw under the notch / home indicator; the header and sticky bars pad with safe-area insets
    viewportFit: "cover",
  };
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  // Rendered per request, so the first paint already has the right time-of-day theme
  const daylight = getDaylight();
  const fonts = [latin, bengali, mono, serif, serifBengali].map((f) => f.variable).join(" ");
  return (
    <html
      lang="en"
      data-phase={daylight.phase}
      className={`${fonts} h-full antialiased ${daylight.phase === "night" ? "dark" : ""}`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col">
        <DaylightProvider initial={daylight}>
          <SiteHeader />
          <main className="mx-auto w-full max-w-6xl flex-1 px-[max(1rem,env(safe-area-inset-left))] py-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:py-6">
            {children}
          </main>
        </DaylightProvider>
      </body>
    </html>
  );
}
