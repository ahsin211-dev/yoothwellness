import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Yooth Wellness",
    template: "%s | Yooth Wellness",
  },
  description:
    "Personalized healthcare and wellness platform — lab tracking, treatment plans, and clinical care.",
  robots: {
    index: false, // Healthcare platform — keep out of search engines
    follow: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#0d7055",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
