import type { Metadata } from "next";
import "./globals.css";
import { UserRoleProvider } from "@/context/UserRoleContext";

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
      <body className="min-h-screen antialiased bg-canvas text-text-main transition-colors duration-200">
        <UserRoleProvider>
          {children}
        </UserRoleProvider>
      </body>
    </html>
  );
}
