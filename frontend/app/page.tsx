import Link from "next/link";
import { ShieldCheck, Terminal, BookOpen, Compass, ArrowRight } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col justify-between">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur px-6 py-4 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <ShieldCheck className="h-7 w-7 text-teal-700" />
            <span className="font-bold text-xl tracking-tight text-slate-900">CloudProof</span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            <Link href="/missions" className="text-slate-600 hover:text-slate-900 transition">
              Missions
            </Link>
            <Link href="/how-it-works" className="text-slate-600 hover:text-slate-900 transition">
              How It Works
            </Link>
            <Link href="/future-vision" className="text-slate-600 hover:text-slate-900 transition">
              Future Vision
            </Link>
            <Link
              href="/missions"
              className="px-4 py-2 text-sm font-semibold text-white bg-teal-700 rounded-lg hover:bg-teal-800 shadow-sm transition"
            >
              Explore Missions
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-20 text-center flex-1 flex flex-col justify-center items-center">
        <div className="inline-flex items-center space-x-2 bg-teal-50 text-teal-800 border border-teal-200 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-6">
          <span>Demo-First Cloud Security Lab</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight max-w-3xl leading-tight">
          Learn Cloud Computing by Fixing What Breaks.
        </h1>
        <p className="mt-5 text-lg text-slate-600 max-w-2xl leading-relaxed">
          CloudProof turns cloud configuration mistakes into interactive learning missions.
          Investigate the problem, choose the right fix, and understand why it works.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/missions"
            className="inline-flex items-center justify-center space-x-2 px-6 py-3 text-base font-semibold text-white bg-teal-700 rounded-lg hover:bg-teal-800 shadow-md transition"
          >
            <span>Explore Missions</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/how-it-works"
            className="inline-flex items-center justify-center px-6 py-3 text-base font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition"
          >
            See How It Works
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-16 text-left w-full max-w-4xl">
          <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm">
            <Terminal className="h-6 w-6 text-teal-700 mb-3" />
            <h3 className="font-semibold text-slate-900 text-base">Investigate Real Incidents</h3>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              Encounter simulated broken cloud settings based on real-world breaches and configuration oversights.
            </p>
          </div>
          <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm">
            <ShieldCheck className="h-6 w-6 text-emerald-600 mb-3" />
            <h3 className="font-semibold text-slate-900 text-base">Deterministic Checks</h3>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              Objective rule evaluation that verifies your fix instantly. No AI scoring hallucinations.
            </p>
          </div>
          <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm">
            <BookOpen className="h-6 w-6 text-amber-600 mb-3" />
            <h3 className="font-semibold text-slate-900 text-base">Understand Mechanics</h3>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              Clear, beginner-friendly explanations that teach the underlying security principles and defense tactics.
            </p>
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        <p>CloudProof Platform &copy; 2026. All mission environments and results are simulated locally.</p>
      </footer>
    </div>
  );
}
