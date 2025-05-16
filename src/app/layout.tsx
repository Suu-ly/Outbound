import { Toaster } from "@/components/ui/sonner";
import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Providers from "./providers";

const generalSans = localFont({
  src: [
    { path: "./GeneralSans-Variable.woff2", style: "normal" },
    { path: "./GeneralSans-VariableItalic.woff2", style: "italic" },
  ],
  display: "swap",
  variable: "--font-general-sans",
});

const clashDisplay = localFont({
  src: "./ClashDisplay-Variable.woff2",
  display: "swap",
  variable: "--font-clash-display",
});

export const metadata: Metadata = {
  title: "Outbound",
  description:
    "We know planning trips can be frustrating. Plan your trips the enjoyable way, with Outbound. Just swipe left or right to decide which places to go, then plan your trip with our easy to use drag-and-drop planner with automatic itinerary generation. Planning has never been this easy.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${generalSans.variable} ${clashDisplay.variable} antialiased`}
    >
      <body className="bg-gray-50">
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
