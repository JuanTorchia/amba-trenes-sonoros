import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AMBA Trenes Sonoros — Música generativa con datos abiertos",
  description:
    "Cada tren del AMBA toca una nota. Un experimento de sonificación con los horarios GTFS públicos de los ferrocarriles argentinos.",
  openGraph: {
    title: "AMBA Trenes Sonoros",
    description: "Música generativa a partir de los horarios reales de los trenes del AMBA.",
    type: "website",
    url: "https://amba-trenes-sonoros.vercel.app",
  },
  twitter: {
    card: "summary_large_image",
    title: "AMBA Trenes Sonoros",
    description: "Cada tren del AMBA toca una nota.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-AR">
      <body>{children}</body>
    </html>
  );
}
