'use client';

import React from 'react';
import { Mission, VerificationResult } from '../types';
import {
  Printer,
  X,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Award,
  Calendar,
  Layers,
} from 'lucide-react';

interface Props {
  mission: Mission;
  verificationResult: VerificationResult;
  onClose: () => void;
}

export function MissionReportCard({
  mission,
  verificationResult,
  onClose,
}: Props) {
  const handlePrint = () => {
    window.print();
  };

  const verificationHash = `CP-${mission.id.toUpperCase()}-${Math.abs(
    verificationResult.evaluatedAt.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  ).toString(16).toUpperCase()}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 print:static print:p-0 print:bg-transparent print:backdrop-blur-none">
      <div className="bg-surface border border-border-subtle rounded-3xl max-w-2xl w-full p-6 sm:p-10 shadow-2xl relative max-h-[95vh] overflow-y-auto print:max-h-none print:shadow-none print:border-none print:p-0 print:overflow-visible print:w-full print:max-w-none">
        {/* Screen Action Bar (Hidden during printing) */}
        <div className="flex items-center justify-between pb-4 border-b border-border-subtle mb-6 print:hidden">
          <div className="flex items-center space-x-2 text-primary font-bold text-xs uppercase tracking-wider">
            <Award className="h-4 w-4" />
            <span>Official Student Verification Report</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-primary hover:bg-primary-hover text-white shadow-sm transition"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full text-text-muted hover:text-text-main hover:bg-surface-secondary transition"
              title="Close report card"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Printable Certificate Body */}
        <div className="border border-border-subtle rounded-2xl p-6 sm:p-8 bg-canvas/40 space-y-6 print:border-2 print:border-black print:bg-white print:text-black">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border-subtle">
            <div>
              <span className="text-[10px] font-bold tracking-widest text-primary uppercase block">
                CloudProof &bull; Practical Cloud Education
              </span>
              <h1 className="text-xl sm:text-2xl font-extrabold text-text-main mt-0.5">
                Cloud Security Verification Report
              </h1>
              <span className="text-xs text-text-muted block mt-1 font-mono">
                Verification Reference ID: {verificationHash}
              </span>
            </div>

            <div className="text-right sm:self-center">
              <span className="text-[11px] font-semibold text-text-muted block flex items-center sm:justify-end space-x-1">
                <Calendar className="h-3 w-3" />
                <span>{new Date(verificationResult.evaluatedAt).toLocaleDateString()}</span>
              </span>
              <div
                className={`mt-1 inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase ${
                  verificationResult.overallStatus === 'passed'
                    ? 'bg-success/15 text-success border border-success/30'
                    : 'bg-warning/15 text-warning border border-warning/30'
                }`}
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>
                  {verificationResult.overallStatus === 'passed'
                    ? '100% Certified Pass'
                    : 'Partial Completion'}
                </span>
              </div>
            </div>
          </div>

          {/* Mission Spec Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-surface border border-border-subtle">
              <span className="text-text-muted text-[11px] block">Incident Mission</span>
              <span className="font-bold text-text-main mt-0.5 block truncate">
                {mission.title}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-surface border border-border-subtle">
              <span className="text-text-muted text-[11px] block">Cloud Service</span>
              <span className="font-bold text-text-main mt-0.5 block">
                {mission.service}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-surface border border-border-subtle">
              <span className="text-text-muted text-[11px] block">Category</span>
              <span className="font-bold text-text-main mt-0.5 block">
                {mission.category}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-surface border border-border-subtle">
              <span className="text-text-muted text-[11px] block">Final Score</span>
              <span className="font-mono font-extrabold text-success text-sm mt-0.5 block">
                {verificationResult.score} / {verificationResult.maxScore}
              </span>
            </div>
          </div>

          {/* Evaluated Target Resource */}
          <div className="p-3.5 rounded-xl bg-surface border border-border-subtle text-xs">
            <span className="text-text-muted text-[11px] block font-semibold">
              Evaluated Infrastructure Target:
            </span>
            <code className="font-mono text-primary font-bold mt-0.5 block break-all">
              {mission.architectureOverview.resourceId}
            </code>
          </div>

          {/* Itemized Invariant Verification Checklist */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-main mb-3">
              Automated Programmatic Invariants Checked
            </h3>
            <div className="space-y-2">
              {verificationResult.rules.map((rule) => (
                <div
                  key={rule.id}
                  className="p-3 rounded-xl bg-surface border border-border-subtle flex items-start justify-between text-xs"
                >
                  <div className="flex items-start space-x-2.5 pr-2">
                    {rule.status === 'pass' ? (
                      <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />
                    ) : rule.status === 'partial' ? (
                      <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="h-4 w-4 text-danger shrink-0 mt-0.5" />
                    )}
                    <div>
                      <span className="font-bold text-text-main block">
                        {rule.name}
                      </span>
                      <p className="text-[11px] text-text-muted mt-0.5">
                        {rule.finding}
                      </p>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-text-main shrink-0">
                    {rule.score}/{rule.maxScore} pts
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* AWS Well-Architected Pillar Alignment */}
          <div className="p-4 rounded-xl bg-surface border border-border-subtle text-xs space-y-1.5">
            <span className="font-bold text-text-main block">
              AWS Well-Architected Framework: {mission.educationalDebrief.awsWellArchitectedPillar}
            </span>
            <p className="text-[11px] text-text-muted leading-relaxed">
              <strong>Prevention Strategy:</strong> {mission.educationalDebrief.preventionStrategy}
            </p>
          </div>

          {/* Evaluator Footer Disclosure */}
          <div className="pt-4 border-t border-border-subtle text-[10px] text-text-muted flex flex-col sm:flex-row justify-between gap-2">
            <span>
              Evaluation engine: Deterministic local simulation. No external remote API runtime.
            </span>
            <span className="font-mono">
              CloudProof Assessment Engine &bull; Version 1.0.0
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
