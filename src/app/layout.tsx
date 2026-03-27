import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "cyrillic"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin", "cyrillic"],
});

export const metadata: Metadata = {
  title: "Flow Studio Pro - Low-code платформа для AI-оркестрации",
  description: "Визуальный конструктор для создания мультиагентных AI-систем. Проектируйте, выполняйте и управляйте AI-потоками с помощью drag-and-drop.",
  keywords: ["AI", "LLM", "конструктор потоков", "мультиагентные системы", "оркестрация", "low-code", "визуальное программирование"],
  authors: [{ name: "Flow Studio Pro Team" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "Flow Studio Pro",
    description: "Low-code платформа для создания мультиагентных AI-оркестраций",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}
