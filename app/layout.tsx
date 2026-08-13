import type { Metadata } from "next";
import { Fraunces, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sorteapp — Premio con respaldo",
  description:
    "Plataforma de sorteos con cursos: comprá tu número, sumate a un curso y participá con transparencia verificable.",
};

// Runs before hydration, blocking, so the very first paint already has the
// right `data-theme` — without this, the page would flash dark (the
// site's default) and then snap to light for anyone who picked light mode,
// since that choice only lives in localStorage (unknown to the server).
const THEME_INIT_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem("sorteapp-theme");
    if (stored === "light" || stored === "dark") {
      document.documentElement.dataset.theme = stored;
    }
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body
        className="min-h-full flex flex-col bg-ink text-foreground"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
