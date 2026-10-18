'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Database,
  Network,
  Key,
  ArrowRight,
  Clock,
  Award,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { getAllMissions } from '@/features/missions/data';

interface MissionProgress {
  score: number;
  status: 'passed' | 'partial' | 'failed';
}

export default function MissionsCataloguePage() {
  const missions = getAllMissions();
  const [progressMap, setProgressMap] = useState<Record<string, MissionProgress>>({});

  useEffect(() => {
    try {
      const map: Record<string, MissionProgress> = {};
      for (const m of missions) {
        const saved = localStorage.getItem(`cloudproof_session_${m.id}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.verificationResult) {
            map[m.id] = {
              score: parsed.verificationResult.score,
              status: parsed.verificationResult.overallStatus,
            };
          }
        }
      }
      setProgressMap(map);
    } catch {
      // Ignore localStorage errors
    }
  }, [missions]);

  const getMissionIcon = (service: string) => {
    if (service.includes('S3')) return Database;
    if (service.includes('Security Groups')) return Network;
    return Key;
  };

  const completedCount = Object.values(progressMap).filter(
    (p) => p.status === 'passed'
  ).length;
  const totalScoreEarned = Object.values(progressMap).reduce(
    (sum, p) => sum + p.score,
    0
  );

  return (
    <div className="min-h-screen flex flex-col justify-between bg-canvas transition-colors">
      <Navbar />

      <main className="max-w-6xl mx-auto px-6 py-14 flex-1 w-full">
        {/* Header Banner */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 pb-8 border-b border-border-subtle">
          <div>
            <div className="inline-flex items-center space-x-1.5 text-xs font-semibold uppercase tracking-wider text-primary bg-primary/10 px-3 py-1 rounded-md mb-2">
              <span>Mission Catalogue</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-text-main tracking-tight">
              Interactive Cloud Missions
            </h1>
            <p className="mt-2 text-text-muted text-sm sm:text-base max-w-2xl leading-relaxed">
              Choose an incident scenario below to enter the interactive workbench. Troubleshoot configuration flaws, apply your fix, and receive automated deterministic verification.
            </p>
          </div>

          {/* Student Progress Badge */}
          {completedCount > 0 && (
            <div className="p-4 rounded-2xl bg-surface border border-border-subtle shadow-sm flex items-center space-x-4 shrink-0">
              <div className="p-2.5 rounded-xl bg-success/10 text-success">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted block">
                  Student Progress
                </span>
                <span className="text-sm font-extrabold text-text-main block">
                  {completedCount} of {missions.length} Missions Mastered
                </span>
                <span className="text-xs text-success font-bold font-mono">
                  {totalScoreEarned} / {missions.length * 100} Points Earned
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Mission Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {missions.map((m) => {
            const Icon = getMissionIcon(m.service);
            const userProgress = progressMap[m.id];
            const isCompleted = userProgress?.status === 'passed';
            const isPartial = userProgress?.status === 'partial';

            return (
              <div
                key={m.id}
                className={`bg-surface border rounded-2xl p-7 shadow-sm hover:shadow-md transition flex flex-col justify-between group ${
                  isCompleted
                    ? 'border-success/40 ring-1 ring-success/20'
                    : 'border-border-subtle'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-surface-secondary text-text-main border border-border-subtle">
                      {m.service}
                    </span>
                    <span className="text-xs text-text-muted flex items-center space-x-1">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{m.estimatedMinutes} min</span>
                    </span>
                  </div>

                  <div className="flex items-center space-x-3 mb-3">
                    <div
                      className={`p-2.5 rounded-xl transition ${
                        isCompleted
                          ? 'bg-success/15 text-success'
                          : 'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="text-xs font-medium text-text-muted block">
                        {m.category}
                      </span>
                      <h2 className="text-lg font-bold text-text-main">
                        {m.title}
                      </h2>
                    </div>
                  </div>

                  <p className="text-sm text-text-muted leading-relaxed mb-6">
                    {m.shortDescription}
                  </p>

                  <div className="flex flex-wrap gap-1.5 mb-6">
                    {m.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[11px] px-2 py-0.5 rounded bg-surface-secondary text-text-muted font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-border-subtle flex items-center justify-between gap-3">
                  <div className="flex items-center space-x-1.5 text-xs font-semibold">
                    {isCompleted ? (
                      <span className="inline-flex items-center space-x-1 text-success font-bold">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Completed (100 pts)</span>
                      </span>
                    ) : isPartial ? (
                      <span className="inline-flex items-center space-x-1 text-warning font-bold">
                        <Award className="h-4 w-4" />
                        <span>In Progress ({userProgress.score} pts)</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1 text-text-muted">
                        <Award className="h-4 w-4 text-accent" />
                        <span>100 pts max</span>
                      </span>
                    )}
                  </div>

                  <Link
                    href={`/missions/${m.id}`}
                    className={`inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg font-semibold text-xs shadow-sm transition ${
                      isCompleted
                        ? 'bg-success hover:bg-success/90 text-white'
                        : 'bg-primary hover:bg-primary-hover text-white'
                    }`}
                  >
                    <span>{isCompleted ? 'Review Fix' : 'Start Mission'}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      <Footer />
    </div>
  );
}
