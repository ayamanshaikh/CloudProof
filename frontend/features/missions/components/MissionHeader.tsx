'use client';

import React from 'react';
import Link from 'next/link';
import { Mission, VerificationResult } from '../types';
import {
  ArrowLeft,
  RotateCcw,
  Sparkles,
  Play,
  Clock,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Award,
} from 'lucide-react';

interface Props {
  mission: Mission;
  verificationResult: VerificationResult | null;
  isVerifying: boolean;
  onReset: () => void;
  onApplyReferenceFix: () => void;
  onRunVerification: () => void;
}

export function MissionHeader({
  mission,
  verificationResult,
  isVerifying,
  onReset,
  onApplyReferenceFix,
  onRunVerification,
}: Props) {
  const score = verificationResult ? verificationResult.score : 0;
  const status = verificationResult ? verificationResult.overallStatus : 'unattempted';

  return (
    <div className="bg-surface border-b border-border-subtle sticky top-0 z-20 backdrop-blur-md bg-surface/95 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Left: Navigation & Title */}
          <div className="flex items-center space-x-3.5">
            <Link
              href="/missions"
              className="p-2 rounded-xl bg-surface-secondary hover:bg-canvas text-text-muted hover:text-text-main border border-border-subtle transition shrink-0"
              title="Return to Mission Catalogue"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>

            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-primary/10 text-primary">
                  {mission.category}
                </span>
                <span className="text-xs text-text-muted flex items-center space-x-1">
                  <Clock className="h-3 w-3" />
                  <span>{mission.estimatedMinutes} min</span>
                </span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-surface-secondary text-text-muted border border-border-subtle">
                  {mission.difficulty}
                </span>
              </div>
              <h1 className="text-lg sm:text-xl font-extrabold text-text-main tracking-tight mt-0.5">
                {mission.title}
              </h1>
            </div>
          </div>

          {/* Right: Score Gauge & Action Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Live Score Pill */}
            <div
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition ${
                status === 'passed'
                  ? 'bg-success/10 text-success border-success/30'
                  : status === 'partial'
                  ? 'bg-warning/10 text-warning border-warning/30'
                  : status === 'failed'
                  ? 'bg-danger/10 text-danger border-danger/30'
                  : 'bg-surface-secondary text-text-muted border-border-subtle'
              }`}
            >
              <Award className="h-4 w-4" />
              <span>
                Score:{' '}
                {verificationResult ? `${verificationResult.score}/100` : 'Not Verified'}
              </span>
            </div>

            {/* Reset Button */}
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-surface-secondary hover:bg-canvas text-text-muted hover:text-text-main border border-border-subtle transition"
              title="Reset scenario back to initial broken state"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>

            {/* Apply Reference Fix (Quick Demo for Evaluators) */}
            <button
              type="button"
              onClick={onApplyReferenceFix}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-accent/10 hover:bg-accent/20 text-accent border border-accent/20 transition"
              title="Apply the recommended secure reference configuration (for demonstrations)"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Reference Fix</span>
            </button>

            {/* Run Verification Button */}
            <button
              type="button"
              onClick={onRunVerification}
              disabled={isVerifying}
              className="inline-flex items-center space-x-1.5 px-4 py-1.5 rounded-xl text-xs font-bold bg-primary hover:bg-primary-hover text-white shadow-sm transition disabled:opacity-50"
            >
              <Play className={`h-3.5 w-3.5 fill-current ${isVerifying ? 'animate-spin' : ''}`} />
              <span>{isVerifying ? 'Checking...' : 'Run Verification'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
