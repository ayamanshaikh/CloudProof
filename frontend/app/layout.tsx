import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CloudProof | Interactive Cloud Incident Learning",
  description: "Learn cloud computing by investigating and fixing real-world-inspired cloud incidents.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen antialiased bg-slate-50 text-slate-900 transition-colors duration-200">
        {children}
      </body>
    </html>
  );
}
