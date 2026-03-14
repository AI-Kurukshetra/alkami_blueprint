import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";
import { Providers } from "./providers";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope"
});

export const metadata: Metadata = {
  title: "NextGen Digital Banking",
  description: "Customer banking portal for the NextGen Digital Banking Experience Platform."
};

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html className={manrope.variable} lang="en">
      <body className="font-[family-name:var(--font-manrope)]">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
