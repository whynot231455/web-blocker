import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { DASHBOARD_META_NAME } from "@/config/sync";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TITLE, SITE_URL } from "@/config/site";

// next/font preloads the file with the HTML and emits a size-matched fallback,
// so a cold load no longer flashes the browser's default `cursive` (Comic Sans).
const pressStart2P = localFont({
  src: "./fonts/PressStart2P-Regular.ttf",
  weight: "400",
  display: "swap",
  variable: "--font-press-start",
  fallback: ["monospace"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const themeInitScript = `
    (() => {
      try {
        const theme = window.localStorage.getItem('ctrl-blck-theme') === 'dark' ? 'dark' : 'light';
        document.documentElement.dataset.ctrlBlckTheme = theme;
        document.body.dataset.ctrlBlckTheme = theme;
      } catch {
        document.documentElement.dataset.ctrlBlckTheme = 'light';
      }
    })();
  `;

  return (
    <html lang="en" className={pressStart2P.variable} suppressHydrationWarning>
      <head>
        <meta name={DASHBOARD_META_NAME} content="true" />
        <link rel="icon" href="/icons/logopic1-32.png" sizes="32x32" type="image/png" />
        <link rel="shortcut icon" href="/icons/logopic1-32.png" type="image/png" />
      </head>
      <body suppressHydrationWarning>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        {children}
      </body>
    </html>
  );
}
