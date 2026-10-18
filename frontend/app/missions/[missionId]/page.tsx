import React from "react";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, Terminal, ArrowRight } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

interface Props {
  params: { missionId: string };
}

export default function MissionDetailPage({ params }: Props) {
  const { missionId } = params;

  return (
    <div className="min-h-screen flex flex-col justify-between bg-canvas transition-colors">
      <Navbar />

      <main className="max-w-4xl mx-auto px-6 py-16 flex-1 w-full flex flex-col justify-center items-center text-center">
        <div className="p-10 bg-surface border border-border-subtle rounded-3xl max-w-xl shadow-sm transition">
          <div className="p-3 bg-primary/10 text-primary rounded-2xl w-fit mx-auto mb-4">
            <Terminal className="h-8 w-8" />
          </div>
          <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-accent/10 text-accent border border-accent/20 mb-3 inline-block">
            Simulated Sandbox Environment
          </span>
          <h1 className="text-2xl font-bold text-text-main mb-2">
            Mission Target: {missionId}
          </h1>
          <p className="text-text-muted text-sm leading-relaxed mb-8">
            The mission briefing, investigation inspector, corrective action controls, and deterministic verification rules for this mission are wired in Phases 3&ndash;6.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/missions"
              className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 bg-surface-secondary border border-border-subtle hover:bg-canvas text-text-main rounded-xl text-sm font-semibold transition"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Catalogue</span>
            </Link>
            <Link
              href="/how-it-works"
              className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl text-sm font-semibold shadow-sm transition"
            >
              <span>See How It Works</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
