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
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name={DASHBOARD_META_NAME} content="true" />
      </head>
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
