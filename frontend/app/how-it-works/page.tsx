import Link from "next/link";
import { ShieldCheck, Search, Wrench, CheckCircle, ArrowRight } from "lucide-react";

export default function HowItWorksPage() {
  const steps = [
    {
      number: "01",
      title: "Investigate a Cloud Incident",
      desc: "Explore a realistic simulated cloud configuration. Inspect access controls, firewall rules, and IAM policies using intuitive inspectors.",
      icon: Search,
    },
    {
      number: "02",
      title: "Choose a Corrective Action",
      desc: "Apply surgical configuration changes. Toggle security flags, tighten CIDR network boundaries, or scope IAM policies to least-privilege.",
      icon: Wrench,
    },
    {
      number: "03",
      title: "Verify the Fix & Understand",
      desc: "Run deterministic programmatic validation. Receive objective scores, pass/fail breakdowns, and pedagogical explanations of security principles.",
      icon: CheckCircle,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-50">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur px-6 py-4 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <ShieldCheck className="h-7 w-7 text-teal-700" />
            <span className="font-bold text-xl tracking-tight text-slate-900">CloudProof</span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            <Link href="/" className="text-slate-600 hover:text-slate-900 transition">
              Home
            </Link>
            <Link href="/missions" className="text-slate-600 hover:text-slate-900 transition">
              Missions
            </Link>
            <Link href="/future-vision" className="text-slate-600 hover:text-slate-900 transition">
              Future Vision
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-16 flex-1 w-full">
        <div className="text-center mb-16">
          <span className="text-xs font-semibold uppercase tracking-wider text-teal-800 bg-teal-50 px-2.5 py-1 rounded-md">
            Pedagogical Methodology
          </span>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mt-3">
            How CloudProof Works
          </h1>
          <p className="mt-3 text-lg text-slate-600 max-w-2xl mx-auto">
            A 3-step active learning loop designed to build practical diagnostic intuition without expensive cloud bills or passive quizzes.
          </p>
        </div>

        <div className="space-y-8">
          {steps.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.number} className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-lg">
                  {s.number}
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-slate-900">{s.title}</h2>
                  <p className="text-slate-600 text-sm mt-1 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/missions"
            className="inline-flex items-center space-x-2 px-6 py-3 bg-teal-700 hover:bg-teal-800 text-white font-semibold rounded-lg shadow-md transition"
          >
            <span>Try an Interactive Mission</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        <p>CloudProof Platform &copy; 2026. All mission environments and results are simulated locally.</p>
      </footer>
    </div>
  );
}
