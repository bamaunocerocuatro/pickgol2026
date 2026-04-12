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
        <link rel="icon" href="/logo.png?v=3" type="image/png" />
        <link rel="shortcut icon" href="/logo.png?v=3" type="image/png" />
        <link rel="apple-touch-icon" href="/logo.png?v=3" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#020810" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Pickgol" />
        <meta property="og:title" content="PICKGOL" />
        <meta property="og:description" content="Jugá, acertá y liderá el ranking ⚽🔥" />
        <meta property="og:image" content="https://pickgol.com/logo.png" />
        <meta property="og:url" content="https://pickgol.com" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content="https://pickgol.com/logo.png" />
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