import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "Notifire.in — Real-time Tech Intelligence",
  description: "Real-time Tech Intelligence Platform. AI-powered news aggregation across AI, Cybersecurity, Cloud, DevOps, Databases, Startups, and more. Ethical scraping, smart summaries, trending detection.",
  keywords: ["notifire", "tech news", "AI", "cybersecurity", "cloud", "devops", "databases", "startup", "news aggregation", "real-time", "RSS"],
  openGraph: {
    title: "Notifire.in — Real-time Tech Intelligence",
    description: "Real-time Tech Intelligence Platform. AI-powered news aggregation.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body
        className="antialiased bg-background text-foreground"
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
