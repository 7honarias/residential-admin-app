import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ReduxProvider from "@/store/provider";
import GoogleAnalytics from "@/components/GoogleAnalytics";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://vestap.co"),
  title: {
    default: "Vestap | Software para Propiedad Horizontal en Colombia",
    template: "%s | Vestap",
  },
  description:
    "Plataforma digital para la administración de conjuntos residenciales y edificios en Colombia. Automatiza recaudos, asambleas, portería y comunicación con residentes.",
  keywords: [
    "software propiedad horizontal Colombia",
    "administración conjuntos residenciales",
    "plataforma copropiedad",
    "gestión conjunto residencial",
    "ley 675",
    "cuota de administración",
    "administrador copropiedad",
  ],
  authors: [{ name: "Vestap", url: "https://vestap.co" }],
  creator: "Vestap",
  openGraph: {
    type: "website",
    locale: "es_CO",
    url: "https://vestap.co",
    siteName: "Vestap",
    title: "Vestap | Software para Propiedad Horizontal en Colombia",
    description:
      "Automatiza la administración de tu conjunto residencial: recaudos, asambleas, portería y más.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Vestap | Software para Propiedad Horizontal",
    description:
      "Digitaliza la gestión de tu copropiedad con Vestap. Asambleas, recaudos y portería en una sola plataforma.",
  },
  icons: {
    icon: "/logo-mobile.png",
    apple: "/logo-mobile.png",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <GoogleAnalytics />
        <ReduxProvider>
          {children}
        </ReduxProvider>
      </body>
    </html>
  );
}
