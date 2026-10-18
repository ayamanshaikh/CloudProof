import Link from "next/link";
import { ArrowLeft, ShieldCheck, AlertCircle } from "lucide-react";

interface Props {
  params: { missionId: string };
}

export default function MissionDetailPage({ params }: Props) {
  const { missionId } = params;

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-50">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur px-6 py-4 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/missions" className="flex items-center space-x-2 text-sm font-medium text-slate-600 hover:text-slate-900">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Missions</span>
          </Link>
          <div className="flex items-center space-x-2">
            <ShieldCheck className="h-6 w-6 text-teal-700" />
            <span className="font-bold text-lg text-slate-900">CloudProof Workbench</span>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-md bg-amber-50 text-amber-800 border border-amber-200 font-medium">
            Simulated Environment
          </span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12 flex-1 w-full flex flex-col justify-center items-center text-center">
        <div className="p-8 bg-white border border-slate-200 rounded-2xl max-w-xl shadow-sm">
          <div className="p-3 bg-teal-50 text-teal-700 rounded-xl w-fit mx-auto mb-4">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Mission: {missionId}</h1>
          <p className="text-slate-600 text-sm leading-relaxed mb-6">
            The interactive workbench for this mission is being wired in Phase 4-6 with the deterministic simulation engine.
          </p>
          <Link
            href="/missions"
            className="inline-flex items-center space-x-2 px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-sm font-medium transition"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Return to Mission Catalogue</span>
          </Link>
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        <p>CloudProof Platform &copy; 2026. All mission environments and results are simulated locally.</p>
      </footer>
    </div>
  );
}
