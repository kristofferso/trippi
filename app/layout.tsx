import "./globals.css";
import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";

import { cn } from "@/lib/utils";
import { SiteHeader } from "@/components/site-header";
import { db } from "@/db";
import { groups } from "@/db/schema";
import { eq } from "drizzle-orm";

export const metadata: Metadata = {
  title: "Trippi",
  description:
    "Trippi is a platform for sharing your travel experiences with your friends and family.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={cn(
          "min-h-screen font-sans antialiased",
          GeistSans.variable,
          GeistMono.variable
        )}
      >
        {children}
      </body>
    </html>
  );
}
