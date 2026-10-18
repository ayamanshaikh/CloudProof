import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Terminal, AlertTriangle } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { getMissionById, getMissionBySlug, getAllMissions } from '@/features/missions/data';
import { MissionWorkbench } from '@/features/missions/components/MissionWorkbench';

interface Props {
  params: { missionId: string };
}

export function generateStaticParams() {
  return getAllMissions().map((m) => ({
    missionId: m.id,
  }));
}

export default function MissionDetailPage({ params }: Props) {
  const { missionId } = params;
  const mission = getMissionById(missionId) || getMissionBySlug(missionId);

  if (!mission) {
    return (
      <div className="min-h-screen flex flex-col justify-between bg-canvas transition-colors">
        <Navbar />

        <main className="max-w-xl mx-auto px-6 py-20 flex-1 w-full flex flex-col justify-center items-center text-center">
          <div className="p-10 bg-surface border border-border-subtle rounded-3xl shadow-sm transition w-full">
            <div className="p-3 bg-danger/10 text-danger rounded-2xl w-fit mx-auto mb-4">
              <AlertTriangle className="h-8 w-8" />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-danger/10 text-danger border border-danger/20 mb-3 inline-block">
              Mission Not Found
            </span>
            <h1 className="text-2xl font-bold text-text-main mb-2">
              Unknown Mission: &quot;{missionId}&quot;
            </h1>
            <p className="text-text-muted text-xs sm:text-sm leading-relaxed mb-6">
              The requested incident scenario identifier does not exist in the mission catalogue. Please choose one of the available interactive cloud missions.
            </p>
            <Link
              href="/missions"
              className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl text-sm font-semibold shadow-sm transition w-full sm:w-auto"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Mission Catalogue</span>
            </Link>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  return <MissionWorkbench mission={mission} />;
}
