import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AgentOS - Your AI Employee",
  description: "Jordan answers calls, manages email, books appointments, and follows up on leads — automatically. Starting at $97/month.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased" style={{ fontFamily: 'Arial, sans-serif' }}>
        {children}
      </body>
    </html>
  );
}
