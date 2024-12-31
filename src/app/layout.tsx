import Footer from "@/components/footer";
import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const generalSans = localFont({
  src: [
    { path: "./fonts/GeneralSans-Variable.woff2", style: "normal" },
    { path: "./fonts/GeneralSans-VariableItalic.woff2", style: "italic" },
  ],
  display: "swap",
  variable: "--font-general-sans",
});

const clashDisplay = localFont({
  src: "./fonts/ClashDisplay-Variable.woff2",
  display: "swap",
  variable: "--font-clash-display",
});

export const metadata: Metadata = {
  title: "Outbound",
  description: "Plan trips the fun way.",
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
      <body>
        {children}
        <Footer />
      </body>
    </html>
  );
}