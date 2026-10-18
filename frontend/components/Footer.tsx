import React from "react";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border-subtle bg-surface transition-colors py-12 px-6">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
        <div className="max-w-sm">
          <Link href="/" className="flex items-center space-x-2 text-text-main font-bold text-lg mb-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <span>CloudProof</span>
          </Link>
          <p className="text-xs text-text-muted leading-relaxed">
            Educational cloud incident flight simulator. Investigate configuration flaws, apply surgical fixes, and verify outcomes deterministically.
          </p>
        </div>

        <nav className="flex flex-wrap gap-6 text-sm text-text-muted">
          <Link href="/" className="hover:text-text-main transition">
            Home
          </Link>
          <Link href="/missions" className="hover:text-text-main transition">
            Missions
          </Link>
          <Link href="/how-it-works" className="hover:text-text-main transition">
            How It Works
          </Link>
          <Link href="/future-vision" className="hover:text-text-main transition">
            Future Vision
          </Link>
        </nav>
      </div>

      <div className="max-w-6xl mx-auto mt-8 pt-6 border-t border-border-subtle flex flex-col sm:flex-row justify-between items-center text-xs text-text-muted gap-4">
        <p>CloudProof Platform &copy; 2026. Built for college cloud education.</p>
        <p className="px-2.5 py-1 rounded bg-surface-secondary border border-border-subtle font-medium text-text-main">
          Simulated Lab Environment &bull; Zero Cloud Cost Guaranteed
        </p>
      </div>
    </footer>
  );
}
