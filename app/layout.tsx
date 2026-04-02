import type { Metadata } from "next";
import "./globals.css";
import PWARegister from "./components/PWARegister";
import { IdiomaProvider } from "./context/IdiomaContext";

export const metadata: Metadata = {
  title: "PICKGOL",
  description: "Jugá, acertá y liderá el ranking ⚽🔥",
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
        <link rel="icon" href="/logo.png?v=2" type="image/png" />
        <link rel="apple-touch-icon" href="/logo.png?v=2" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#020810" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="PICKGOL" />
      </head>
      <body className="bg-[#020810] text-white antialiased">
        <IdiomaProvider>
          <PWARegister />
          {children}
        </IdiomaProvider>
      </body>
    </html>
  );
}