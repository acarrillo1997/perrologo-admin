import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Perrologo Admin",
  description: "Internal dashboard for Perrologo"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
