import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PickGol 2026",
  description: "El prode del mundial",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800;900&family=Barlow:wght@300;400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-[#020810] text-white antialiased">
        {children}
      </body>
    </html>
  );
}