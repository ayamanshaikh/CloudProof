import Link from "next/link";
import { ShieldCheck, Terminal, Award, BookOpen } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col justify-between">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="h-7 w-7 text-blue-600" />
            <span className="font-bold text-xl tracking-tight text-slate-900">CloudProof</span>
          </div>
          <div className="flex items-center space-x-4">
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm transition"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-16 text-center flex-1 flex flex-col justify-center items-center">
        <div className="inline-flex items-center space-x-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-6">
          <span>Hands-on Cloud Lab & Verification Platform</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight max-w-3xl">
          Learn Cloud Computing by Solving Realistic Incidents.
        </h1>
        <p className="mt-5 text-lg text-slate-600 max-w-2xl">
          Stop memorizing multiple-choice questions or following recipe labs. Investigate misconfigured infrastructure, fix the issue, and receive automated deterministic verification with AI-guided explanations.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/register"
            className="px-6 py-3 text-base font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-md transition"
          >
            Launch Demo Mission
          </Link>
          <Link
            href="/login"
            className="px-6 py-3 text-base font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition"
          >
            Instructor Portal
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-16 text-left w-full max-w-4xl">
          <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm">
            <Terminal className="h-6 w-6 text-blue-600 mb-3" />
            <h3 className="font-semibold text-slate-900">Incident-First Learning</h3>
            <p className="text-sm text-slate-600 mt-1">
              Encounter realistic broken cloud environments. Diagnose root causes using standard tools.
            </p>
          </div>
          <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm">
            <ShieldCheck className="h-6 w-6 text-emerald-600 mb-3" />
            <h3 className="font-semibold text-slate-900">Deterministic Verification</h3>
            <p className="text-sm text-slate-600 mt-1">
              Objective grading through direct rule checking. Zero grading hallucinations.
            </p>
          </div>
          <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm">
            <BookOpen className="h-6 w-6 text-purple-600 mb-3" />
            <h3 className="font-semibold text-slate-900">Intelligent Post-Mortems</h3>
            <p className="text-sm text-slate-600 mt-1">
              AI-driven educational breakdowns explaining vulnerability mechanisms and industry best practices.
            </p>
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        CloudProof Platform &copy; 2026. Built for college cloud education and verifiable skills.
      </footer>
    </div>
  );
}
