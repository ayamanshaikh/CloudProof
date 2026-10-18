import Link from "next/link";
import { ShieldCheck, ArrowLeft, ArrowRight, Database, Network, Key } from "lucide-react";

export default function MissionsCataloguePage() {
  const missions = [
    {
      id: "s3-leaky-bucket",
      title: "The Leaky Bucket",
      category: "Storage Security",
      difficulty: "Beginner",
      estimatedTime: "15 min",
      icon: Database,
      description:
        "A startup accidentally configured its invoice storage so that data may be publicly accessible. Investigate the simulated bucket settings and secure it without breaking the intended access model.",
    },
    {
      id: "sg-door-open",
      title: "Door Left Open",
      category: "Network Security",
      difficulty: "Intermediate",
      estimatedTime: "20 min",
      icon: Network,
      description:
        "A development environment exposes SSH to the entire internet. Investigate the simulated security group and restrict access to authorized CIDR ranges.",
    },
    {
      id: "iam-too-much-power",
      title: "Too Much Power",
      category: "Identity & Access Management",
      difficulty: "Intermediate",
      estimatedTime: "25 min",
      icon: Key,
      description:
        "An application has more permissions than it needs. Identify the overly broad policy and replace it with a least-privilege configuration.",
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
            <Link href="/how-it-works" className="text-slate-600 hover:text-slate-900 transition">
              How It Works
            </Link>
            <Link href="/future-vision" className="text-slate-600 hover:text-slate-900 transition">
              Future Vision
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12 flex-1 w-full">
        <div className="mb-8">
          <div className="inline-flex items-center space-x-1.5 text-xs font-semibold uppercase tracking-wider text-teal-800 bg-teal-50 px-2.5 py-1 rounded-md mb-2">
            <span>Mission Catalogue</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Interactive Cloud Missions</h1>
          <p className="mt-2 text-slate-600">
            Select a simulated cloud incident below. Investigate configuration flaws, apply fixes, and verify results.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {missions.map((m) => {
            const Icon = m.icon;
            return (
              <div
                key={m.id}
                className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {m.category}
                    </span>
                    <span className="text-xs text-slate-500">{m.estimatedTime}</span>
                  </div>
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="p-2 rounded-lg bg-teal-50 text-teal-700">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h2 className="text-lg font-bold text-slate-900">{m.title}</h2>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed mb-6">{m.description}</p>
                </div>

                <Link
                  href={`/missions/${m.id}`}
                  className="w-full inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-medium text-sm transition"
                >
                  <span>Start Mission</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            );
          })}
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        <p>CloudProof Platform &copy; 2026. All mission environments and results are simulated locally.</p>
      </footer>
    </div>
  );
}
