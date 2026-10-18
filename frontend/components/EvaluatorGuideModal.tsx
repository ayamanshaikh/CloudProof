'use client';

import React from 'react';
import Link from 'next/link';
import {
  Award,
  CheckCircle2,
  X,
  Play,
  Printer,
  Sparkles,
  ArrowRight,
  Terminal,
  ShieldCheck,
  BookOpen,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function EvaluatorGuideModal({ isOpen, onClose }: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface border border-border-subtle rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-text-muted hover:text-text-main hover:bg-surface-secondary transition"
          title="Close guide"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="inline-flex p-3 rounded-2xl bg-primary/10 text-primary mb-3">
            <Award className="h-7 w-7" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 block w-fit mx-auto mb-1.5">
            2-Minute Evaluator Tour
          </span>
          <h2 className="text-xl font-bold text-text-main">
            Guide for Professors & Evaluators
          </h2>
          <p className="text-xs text-text-muted mt-1 leading-relaxed">
            Follow this 4-step path to assess the core educational loops, simulation engine, and deterministic verification rules.
          </p>
        </div>

        {/* 4 Steps */}
        <div className="space-y-3.5 text-xs">
          <div className="p-3.5 rounded-2xl bg-surface-secondary/40 border border-border-subtle flex items-start space-x-3">
            <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
              1
            </div>
            <div>
              <span className="font-bold text-text-main block">
                Open any Interactive Mission
              </span>
              <p className="text-text-muted text-[11px] leading-relaxed mt-0.5">
                Navigate to the Mission Catalogue and select <em>The Leaky Bucket</em> (Storage), <em>Door Left Open</em> (VPC), or <em>Too Much Power</em> (IAM).
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-surface-secondary/40 border border-border-subtle flex items-start space-x-3">
            <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
              2
            </div>
            <div>
              <span className="font-bold text-text-main block">
                Inspect Incident Telemetry
              </span>
              <p className="text-text-muted text-[11px] leading-relaxed mt-0.5">
                In the left briefing pane, click <strong>Telemetry & Logs</strong> to inspect authentic CloudTrail JSON events and VPC Flow Logs.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-surface-secondary/40 border border-border-subtle flex items-start space-x-3">
            <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
              3
            </div>
            <div>
              <span className="font-bold text-text-main block">
                Test the Quick &quot;Reference Fix&quot;
              </span>
              <p className="text-text-muted text-[11px] leading-relaxed mt-0.5">
                Click <strong>Reference Fix</strong> in the top bar to instantly apply the compliant architecture and trigger automatic 100/100 verification.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-surface-secondary/40 border border-border-subtle flex items-start space-x-3">
            <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
              4
            </div>
            <div>
              <span className="font-bold text-text-main block">
                View & Print the Evaluation Report
              </span>
              <p className="text-text-muted text-[11px] leading-relaxed mt-0.5">
                Click <strong>Report Card</strong> to inspect the printable student assessment certificate formatted for course grading.
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-6 pt-5 border-t border-border-subtle flex items-center justify-between gap-3">
          <Link
            href="/missions/s3-leaky-bucket"
            onClick={onClose}
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-primary hover:bg-primary-hover text-white shadow-sm transition w-full justify-center"
          >
            <span>Start Evaluator Walkthrough (Mission 1)</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
