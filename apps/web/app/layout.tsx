import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PayPilot — AI Financial Operations Agent for Independent Businesses",
  description: "Natural-language invoicing, approval-governed agentic workflows, and PayPal developer platform integration.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#080c14] text-slate-100 antialiased selection:bg-cyan-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
