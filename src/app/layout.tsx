import type { Metadata } from "next";
import { Newsreader } from "next/font/google";

import "./globals.css";

const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-newsreader",
});

export const metadata: Metadata = {
  title: "Agent Dates",
  description: "Create strange personas, pair them up, and watch their date stories unfold.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${newsreader.variable} bg-background text-ink antialiased`}>
        {children}
      </body>
    </html>
  );
}
