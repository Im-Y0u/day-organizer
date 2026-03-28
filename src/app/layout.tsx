import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Day Organizer - Simple Daily Task Manager",
  description: "A lightweight, simple daily task organizer to help you plan your day better. Add tasks with timeframes and manage daily recurring tasks.",
  keywords: ["task manager", "daily planner", "schedule", "productivity", "day organizer"],
  authors: [{ name: "Day Organizer" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "Day Organizer",
    description: "Simple daily task manager for better day planning",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
