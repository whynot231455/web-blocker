import type { Metadata } from "next";
import "./globals.css";
import { DASHBOARD_META_NAME } from "@/config/sync";

export const metadata: Metadata = {
  title: "CTRL+BLCK | Focus Mode & Web Blocker",
  description: "Boost your productivity with CTRL+BLCK. A seamless, synced web blocker for deep work and distraction-free browsing.",
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
    <html lang="en" suppressHydrationWarning>
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
