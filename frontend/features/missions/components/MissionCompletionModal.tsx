'use client';

import React from 'react';
import Link from 'next/link';
import { Mission, VerificationResult } from '../types';
import { getAllMissions } from '../data';
import {
  Award,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  RotateCcw,
  Printer,
  X,
  ShieldCheck,
  BookOpen,
} from 'lucide-react';

interface Props {
  mission: Mission;
  verificationResult: VerificationResult;
  onClose: () => void;
  onReset: () => void;
  onOpenReportCard: () => void;
}

export function MissionCompletionModal({
  mission,
  verificationResult,
  onClose,
  onReset,
  onOpenReportCard,
}: Props) {
  // Determine next mission in sequence
  const allMissions = getAllMissions();
  const currentIndex = allMissions.findIndex((m) => m.id === mission.id);
  const nextMission =
    currentIndex !== -1 && currentIndex + 1 < allMissions.length
      ? allMissions[currentIndex + 1]
      : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface border border-border-subtle rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-text-muted hover:text-text-main hover:bg-surface-secondary transition"
          title="Close modal"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Trophy / Header */}
        <div className="text-center">
          <div className="inline-flex p-3 rounded-2xl bg-success/10 text-success border border-success/20 mb-3 animate-bounce">
            <Award className="h-8 w-8" />
          </div>

          <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-success/10 text-success border border-success/20 block w-fit mx-auto mb-2">
            Mission Mastered &bull; 100% Verified
          </span>

          <h2 className="text-2xl font-extrabold text-text-main tracking-tight">
            {mission.title}
          </h2>
          <p className="text-xs sm:text-sm text-text-muted mt-1 max-w-md mx-auto">
            All security invariants satisfied. You have successfully remediated the vulnerability and secured the cloud infrastructure.
          </p>
        </div>

        {/* Score Card Callout */}
        <div className="mt-6 p-5 rounded-2xl bg-surface-secondary/50 border border-border-subtle flex items-center justify-between">
          <div>
            <span className="text-xs text-text-muted block">Final Evaluation Score</span>
            <div className="flex items-baseline space-x-1 mt-0.5">
              <span className="text-3xl font-extrabold text-success font-mono">
                {verificationResult.score}
              </span>
              <span className="text-sm font-bold text-text-muted font-mono">
                / {verificationResult.maxScore}
              </span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs text-text-muted block">Invariants Passed</span>
            <span className="text-sm font-bold text-text-main mt-0.5 block font-mono">
              {verificationResult.rules.filter((r) => r.status === 'pass').length} of{' '}
              {verificationResult.rules.length} Rules (100%)
            </span>
          </div>
        </div>

        {/* Educational Debrief Highlight */}
        <div className="mt-5 p-4 rounded-xl bg-canvas border border-border-subtle text-xs space-y-2">
          <div className="flex items-center space-x-1.5 text-primary font-bold">
            <ShieldCheck className="h-4 w-4" />
            <span>Architecture Takeaway:</span>
          </div>
          <p className="text-text-muted leading-relaxed">
            {mission.educationalDebrief.preventionStrategy}
          </p>
        </div>

        {/* Next Mission Teaser */}
        {nextMission ? (
          <div className="mt-5 p-4 rounded-2xl border border-primary/20 bg-primary/5 flex items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary block">
                Next Recommended Mission
              </span>
              <h4 className="text-sm font-bold text-text-main mt-0.5">
                {nextMission.title} ({nextMission.category})
              </h4>
              <span className="text-xs text-text-muted">
                Estimated time: {nextMission.estimatedMinutes} min &bull; {nextMission.difficulty}
              </span>
            </div>

            <Link
              href={`/missions/${nextMission.id}`}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-primary hover:bg-primary-hover text-white shadow-sm transition shrink-0"
            >
              <span>Continue</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        ) : (
          <div className="mt-5 p-4 rounded-2xl border border-accent/20 bg-accent/5 text-center">
            <Sparkles className="h-5 w-5 text-accent mx-auto mb-1" />
            <h4 className="text-sm font-bold text-text-main">
              All Incident Missions Mastered!
            </h4>
            <p className="text-xs text-text-muted mt-0.5">
              You have completed every scenario in this version of CloudProof.
            </p>
          </div>
        )}

        {/* Action Controls */}
        <div className="mt-6 pt-5 border-t border-border-subtle flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={onOpenReportCard}
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-surface-secondary hover:bg-canvas text-text-main border border-border-subtle transition"
          >
            <Printer className="h-4 w-4" />
            <span>Printable Evaluation Report</span>
          </button>

          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center justify-center space-x-1 px-3 py-2 rounded-xl text-xs font-semibold text-text-muted hover:text-text-main transition"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Replay</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-xs font-bold bg-surface-secondary text-text-main hover:bg-canvas border border-border-subtle transition"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
