import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/layout/Providers";
import { Header } from "@/components/layout/Header";

export const metadata: Metadata = {
  title: "StuntWatch — Peta Risiko Stunting Indonesia",
  description:
    "Platform pemantauan dan pemetaan risiko stunting interaktif di seluruh 38 provinsi dan 514 kabupaten/kota di Indonesia.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className="min-h-screen flex flex-col">
        <Providers>
          <Header />
          <div className="flex-1">{children}</div>
        </Providers>
      </body>
    </html>
  );
}
