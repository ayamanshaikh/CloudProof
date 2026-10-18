import Link from "next/link";
import { ShieldCheck, Cloud, Cpu, GraduationCap, CheckCircle2 } from "lucide-react";

export default function FutureVisionPage() {
  const visionItems = [
    {
      title: "Real AWS Infrastructure Verification",
      badge: "Future Capability",
      desc: "Beyond simulation: automated verification on live student AWS sandbox accounts via least-privilege cross-account STS AssumeRole, auditing real S3 buckets and IAM policies.",
      icon: Cloud,
    },
    {
      title: "Instructor LMS Integration (Canvas / Blackboard)",
      badge: "Future Capability",
      desc: "LTI 1.3 standards-compliant grade passback, automated roster synchronization, class mistake matrix analytics, and customizable assignment due dates.",
      icon: GraduationCap,
    },
    {
      title: "Multi-Cloud Curriculum (Azure & Google Cloud)",
      badge: "Future Capability",
      desc: "Expanding declarative incident packs to Azure Blob Storage, Azure Network Security Groups, Google Cloud IAM, and Cloud Storage bucket security.",
      icon: Cpu,
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
            <Link href="/how-it-works" className="text-slate-600 hover:text-slate-900 transition">
              How It Works
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-16 flex-1 w-full">
        <div className="text-center mb-16">
          <span className="text-xs font-semibold uppercase tracking-wider text-teal-800 bg-teal-50 px-2.5 py-1 rounded-md">
            Product Roadmap
          </span>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mt-3">
            The Future of CloudProof
          </h1>
          <p className="mt-3 text-lg text-slate-600 max-w-2xl mx-auto">
            This interactive demo represents the core student flight simulator. Here is how the platform is architected to expand for university adoption.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {visionItems.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="p-3 bg-teal-50 text-teal-700 rounded-xl w-fit mb-4">
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                    {item.badge}
                  </span>
                  <h2 className="text-lg font-bold text-slate-900 mt-3">{item.title}</h2>
                  <p className="text-slate-600 text-sm mt-2 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-12 p-6 bg-white border border-slate-200 rounded-xl shadow-sm text-center">
          <h3 className="font-semibold text-slate-900">Current Demo Boundary Disclosure</h3>
          <p className="text-slate-600 text-sm mt-1 max-w-xl mx-auto">
            All three missions in this build run on a 100% client-side deterministic simulation engine. No actual cloud infrastructure is modified, and no cloud bills are incurred.
          </p>
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        <p>CloudProof Platform &copy; 2026. All mission environments and results are simulated locally.</p>
      </footer>
    </div>
  );
}
