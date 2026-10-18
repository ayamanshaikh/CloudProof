"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheck, Menu, X, ArrowRight, Award } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { EvaluatorGuideModal } from "./EvaluatorGuideModal";

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [evaluatorModalOpen, setEvaluatorModalOpen] = useState(false);
  const pathname = usePathname();

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Missions", href: "/missions" },
    { name: "How It Works", href: "/how-it-works" },
    { name: "Future Vision", href: "/future-vision" },
  ];

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <header className="border-b border-border-subtle bg-surface/90 backdrop-blur-md sticky top-0 z-50 transition-colors">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link
          href="/"
          className="flex items-center space-x-2.5 group focus-visible:ring-2 focus-visible:ring-primary rounded-lg p-1 -ml-1"
        >
          <div className="p-1.5 rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <span className="font-bold text-xl tracking-tight text-text-main">
            CloudProof
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-7 text-sm font-medium">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className={`transition pb-0.5 ${
                isActive(link.href)
                  ? "text-primary font-semibold border-b-2 border-primary"
                  : "text-text-muted hover:text-text-main"
              }`}
            >
              {link.name}
            </Link>
          ))}
        </nav>

        {/* Desktop CTA, Evaluator Tour & Theme */}
        <div className="hidden md:flex items-center space-x-3">
          <button
            type="button"
            onClick={() => setEvaluatorModalOpen(true)}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-lg transition focus-visible:ring-2 focus-visible:ring-primary"
            title="Open 2-minute tour for professors & evaluators"
          >
            <Award className="h-3.5 w-3.5" />
            <span>Evaluator Tour</span>
          </button>
          <ThemeToggle />
          <Link
            href="/missions"
            className="inline-flex items-center space-x-1.5 px-4 py-2 text-sm font-semibold text-white bg-primary hover:bg-primary-hover rounded-lg shadow-sm transition focus-visible:ring-2 focus-visible:ring-primary"
          >
            <span>Explore Missions</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Mobile Hamburger & Theme */}
        <div className="flex md:hidden items-center space-x-2">
          <button
            type="button"
            onClick={() => setEvaluatorModalOpen(true)}
            className="p-2 rounded-lg text-primary bg-primary/10 hover:bg-primary/20 border border-primary/20 transition"
            title="Evaluator Tour"
          >
            <Award className="h-4 w-4" />
          </button>
          <ThemeToggle />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            type="button"
            className="p-2 rounded-lg border border-border-subtle bg-surface text-text-muted hover:text-text-main"
            aria-label="Toggle Navigation Menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-border-subtle bg-surface px-6 py-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-150">
          <nav className="flex flex-col space-y-2 text-sm font-medium">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`py-2 px-3 rounded-lg transition ${
                  isActive(link.href)
                    ? "bg-surface-secondary text-primary font-semibold"
                    : "text-text-muted hover:text-text-main hover:bg-surface-secondary"
                }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>
          <div className="pt-2 border-t border-border-subtle space-y-2">
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                setEvaluatorModalOpen(true);
              }}
              className="w-full inline-flex items-center justify-center space-x-1.5 px-4 py-2.5 text-sm font-semibold text-primary bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-lg transition"
            >
              <Award className="h-4 w-4" />
              <span>Evaluator 2-Min Tour</span>
            </button>
            <Link
              href="/missions"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full inline-flex items-center justify-center space-x-1.5 px-4 py-2.5 text-sm font-semibold text-white bg-primary hover:bg-primary-hover rounded-lg shadow-sm transition"
            >
              <span>Explore Missions</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}

      {/* Evaluator Guide Modal */}
      <EvaluatorGuideModal
        isOpen={evaluatorModalOpen}
        onClose={() => setEvaluatorModalOpen(false)}
      />
    </header>
  );
}
