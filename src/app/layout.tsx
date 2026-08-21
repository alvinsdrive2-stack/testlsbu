import type { Metadata } from "next";
import { NavigationProgress } from "@/components/ui/NavigationProgress";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gapensi Ujian",
  description: "Platform ujian pelatihan Gapensi",
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
      </body>
    </html>
  );
}
