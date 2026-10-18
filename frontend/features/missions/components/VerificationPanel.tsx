'use client';

import React from 'react';
import { Mission, VerificationResult } from '../types';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Play,
  Award,
  BookOpen,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Info,
  Sparkles,
} from 'lucide-react';

interface Props {
  mission: Mission;
  verificationResult: VerificationResult | null;
  isVerifying: boolean;
  onRunVerification: () => void;
  onApplyReferenceFix: () => void;
  onOpenReportCard?: () => void;
}

export function VerificationPanel({
  mission,
  verificationResult,
  isVerifying,
  onRunVerification,
  onApplyReferenceFix,
  onOpenReportCard,
}: Props) {
  if (!verificationResult) {
    return (
      <div className="bg-surface border border-border-subtle rounded-2xl p-8 text-center shadow-sm">
        <div className="p-4 rounded-2xl bg-primary/10 text-primary w-fit mx-auto mb-4">
          <Award className="h-8 w-8" />
        </div>
        <h3 className="text-lg font-bold text-text-main mb-2">
          Simulation Not Yet Verified
        </h3>
        <p className="text-xs sm:text-sm text-text-muted max-w-md mx-auto leading-relaxed mb-6">
          Investigate the simulated cloud configuration in the editor. Apply your security remediations, then click below to run deterministic verification checks.
        </p>
        <button
          type="button"
          onClick={onRunVerification}
          disabled={isVerifying}
          className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-xl font-bold text-sm bg-primary hover:bg-primary-hover text-white shadow-sm transition disabled:opacity-50"
        >
          <Play className="h-4 w-4 fill-current" />
          <span>{isVerifying ? 'Evaluating Invariants...' : 'Run Verification Check'}</span>
        </button>
      </div>
    );
  }

  const { overallStatus, score, maxScore, rules, summary, educationalTakeaways } =
    verificationResult;

  return (
    <div className="space-y-6">
      {/* Overall Score & Verdict Header */}
      <div
        className={`rounded-2xl p-6 border shadow-sm transition ${
          overallStatus === 'passed'
            ? 'bg-success/5 border-success/30'
            : overallStatus === 'partial'
            ? 'bg-warning/5 border-warning/30'
            : 'bg-danger/5 border-danger/30'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            {/* Score Ring / Gauge */}
            <div
              className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center border font-extrabold shrink-0 shadow-sm ${
                overallStatus === 'passed'
                  ? 'bg-success text-white border-success'
                  : overallStatus === 'partial'
                  ? 'bg-warning text-white border-warning'
                  : 'bg-danger text-white border-danger'
              }`}
            >
              <span className="text-xl leading-none">{score}</span>
              <span className="text-[10px] opacity-80 uppercase font-semibold">
                /{maxScore}
              </span>
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <span
                  className={`text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                    overallStatus === 'passed'
                      ? 'bg-success/20 text-success'
                      : overallStatus === 'partial'
                      ? 'bg-warning/20 text-warning'
                      : 'bg-danger/20 text-danger'
                  }`}
                >
                  {overallStatus === 'passed'
                    ? 'Security Invariants Passed'
                    : overallStatus === 'partial'
                    ? 'Partial Invariants Passed'
                    : 'Security Violations Detected'}
                </span>
              </div>
              <h3 className="text-lg font-bold text-text-main mt-1">
                {overallStatus === 'passed'
                  ? 'Mission Completed Successfully'
                  : overallStatus === 'partial'
                  ? 'Incomplete Remediation'
                  : 'Vulnerabilities Remain Active'}
              </h3>
            </div>
          </div>

          <div className="flex items-center space-x-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={onRunVerification}
              disabled={isVerifying}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-primary hover:bg-primary-hover text-white shadow-sm transition disabled:opacity-50"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              <span>{isVerifying ? 'Re-checking...' : 'Re-verify'}</span>
            </button>
            {onOpenReportCard && (
              <button
                type="button"
                onClick={onOpenReportCard}
                className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-surface hover:bg-surface-secondary text-text-main border border-border-subtle transition"
                title="View and print official evaluation report card"
              >
                <Award className="h-3.5 w-3.5 text-primary" />
                <span>Report Card</span>
              </button>
            )}
            {overallStatus !== 'passed' && (
              <button
                type="button"
                onClick={onApplyReferenceFix}
                className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-surface hover:bg-surface-secondary text-text-main border border-border-subtle transition"
              >
                <Sparkles className="h-3.5 w-3.5 text-accent" />
                <span>Show Reference Fix</span>
              </button>
            )}
          </div>
        </div>

        <p className="mt-4 text-xs sm:text-sm text-text-muted leading-relaxed pt-3 border-t border-border-subtle">
          {summary}
        </p>
      </div>

      {/* Itemized Invariant Checks */}
      <div className="bg-surface border border-border-subtle rounded-2xl p-6 shadow-sm">
        <div className="pb-4 border-b border-border-subtle">
          <h3 className="text-base font-bold text-text-main">
            Programmatic Rule Invariants ({rules.filter((r) => r.status === 'pass').length}/{rules.length} Passed)
          </h3>
          <p className="text-xs text-text-muted mt-1">
            Automated compliance checks evaluated directly against your simulated configuration.
          </p>
        </div>

        <div className="mt-4 space-y-4">
          {rules.map((rule) => {
            const isPass = rule.status === 'pass';
            const isPartial = rule.status === 'partial';

            return (
              <div
                key={rule.id}
                className={`p-4 rounded-xl border transition ${
                  isPass
                    ? 'bg-success/5 border-success/30'
                    : isPartial
                    ? 'bg-warning/5 border-warning/30'
                    : 'bg-danger/5 border-danger/30'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-border-subtle">
                  <div className="flex items-center space-x-2.5">
                    {isPass ? (
                      <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                    ) : isPartial ? (
                      <AlertTriangle className="h-4 w-4 text-warning shrink-0" />
                    ) : (
                      <XCircle className="h-4 w-4 text-danger shrink-0" />
                    )}
                    <span className="text-sm font-bold text-text-main">
                      {rule.name}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2 self-start sm:self-auto">
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        rule.severity === 'critical'
                          ? 'bg-danger/20 text-danger'
                          : rule.severity === 'high'
                          ? 'bg-warning/20 text-warning'
                          : 'bg-primary/20 text-primary'
                      }`}
                    >
                      {rule.severity}
                    </span>
                    <span
                      className={`text-xs font-mono font-bold px-2 py-0.5 rounded-md ${
                        isPass
                          ? 'bg-success/10 text-success'
                          : isPartial
                          ? 'bg-warning/10 text-warning'
                          : 'bg-danger/10 text-danger'
                      }`}
                    >
                      {rule.score}/{rule.maxScore} pts
                    </span>
                  </div>
                </div>

                <div className="mt-3 space-y-2 text-xs">
                  <div>
                    <span className="font-semibold text-text-main">Finding:</span>{' '}
                    <span className="text-text-muted">{rule.finding}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-text-main">Why This Matters:</span>{' '}
                    <span className="text-text-muted">{rule.explanation}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-text-main">Recommendation:</span>{' '}
                    <span className="text-text-muted">{rule.recommendation}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Educational Debrief & Takeaways */}
      <div className="bg-surface border border-border-subtle rounded-2xl p-6 shadow-sm">
        <div className="flex items-center space-x-2 text-primary mb-3">
          <BookOpen className="h-4 w-4" />
          <h3 className="text-base font-bold text-text-main">
            Educational Debrief & Key Takeaways
          </h3>
        </div>

        <div className="space-y-2.5 mb-6">
          {educationalTakeaways.map((takeaway, idx) => (
            <div
              key={idx}
              className="p-3 rounded-xl bg-surface-secondary/40 border border-border-subtle text-xs text-text-muted leading-relaxed flex items-start space-x-2.5"
            >
              <span className="font-bold text-primary shrink-0">&bull;</span>
              <span>{takeaway}</span>
            </div>
          ))}
        </div>

        {/* AWS Well-Architected Context */}
        <div className="pt-4 border-t border-border-subtle grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-surface-secondary/30 border border-border-subtle">
            <span className="font-bold text-text-main block mb-1">
              Root Cause Analysis
            </span>
            <p className="text-text-muted text-[11px] leading-relaxed">
              {mission.educationalDebrief.rootCause}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-surface-secondary/30 border border-border-subtle">
            <span className="font-bold text-text-main block mb-1">
              Real-World Impact
            </span>
            <p className="text-text-muted text-[11px] leading-relaxed">
              {mission.educationalDebrief.realWorldImpact}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-surface-secondary/30 border border-border-subtle md:col-span-2">
            <span className="font-bold text-text-main block mb-1">
              AWS Well-Architected Framework Alignment
            </span>
            <p className="text-text-muted text-[11px] leading-relaxed">
              <strong className="text-primary">
                {mission.educationalDebrief.awsWellArchitectedPillar}:
              </strong>{' '}
              {mission.educationalDebrief.preventionStrategy}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
