import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CloudProof | Educational Cloud Incident & Verification Platform",
  description: "Learn cloud computing through realistic, verifiable hands-on infrastructure missions.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}

