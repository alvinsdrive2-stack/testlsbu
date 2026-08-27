import type { Metadata } from "next";
import { NavigationProgress } from "@/components/ui/NavigationProgress";
import { ToasterHost } from "@/components/ui/ToasterHost";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gapensi Ujian",
  description: "Platform ujian pelatihan Gapensi",
  icons: { icon: "/favico.png" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body>
        <NavigationProgress />
        {children}
        <ToasterHost />
      </body>
    </html>
  );
}
