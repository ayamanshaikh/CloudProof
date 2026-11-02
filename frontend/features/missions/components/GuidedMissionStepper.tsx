'use client';

import React from 'react';
import { Mission, MissionState, VerificationResult } from '../types';
import {
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Play,
  Award,
  Terminal,
} from 'lucide-react';

interface Props {
  mission: Mission;
  currentState: MissionState;
  activeTab: 'simulation' | 'configurator' | 'verification';
  onSelectTab: (tab: 'simulation' | 'configurator' | 'verification') => void;
  onApplyFix: () => void;
  onRunVerification: () => void;
  verificationResult: VerificationResult | null;
}

export function GuidedMissionStepper({
  mission,
  currentState,
  activeTab,
  onSelectTab,
  onApplyFix,
  onRunVerification,
  verificationResult,
}: Props) {
  // Determine if Step 2 is satisfied dynamically
  let isStep2Done = false;
  if (currentState.type === 's3') {
    const bpa = currentState.config.blockPublicAccess;
    isStep2Done =
      bpa.blockPublicAcls &&
      bpa.ignorePublicAcls &&
      bpa.blockPublicPolicy &&
      bpa.restrictPublicBuckets &&
      currentState.config.bucketAcl === 'private';
  } else if (currentState.type === 'security-group') {
    isStep2Done = !currentState.config.inboundRules.some(
      (r) =>
        (r.protocol === 'all' || r.portRange === '22' || (r.fromPort <= 22 && r.toPort >= 22)) &&
        (r.source === '0.0.0.0/0' || r.source === '::/0')
    );
  } else if (currentState.type === 'iam-role') {
    const activeDoc = currentState.config.inlinePolicies[0]?.policyDocument || '{}';
    isStep2Done = !activeDoc.includes('"Action": "*"') && !activeDoc.includes('"Resource": "*"');
  }

  const isStep3Done = verificationResult?.score === 100;
  const currentStepNumber = isStep3Done ? 3 : isStep2Done ? 3 : 2;

  return (
    <div className="bg-surface border-2 border-primary/20 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4 animate-in fade-in duration-150">
      {/* Stepper Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border-subtle">
        <div className="flex items-center space-x-2">
          <span className="p-1.5 rounded-xl bg-primary/10 text-primary">
            <Sparkles className="h-4 w-4" />
          </span>
          <div>
            <h3 className="text-sm font-bold text-text-main">
              Tinkercad Guided Walkthrough
            </h3>
            <span className="text-[11px] text-text-muted">
              Follow these 3 easy steps to complete this mission with zero confusion.
            </span>
          </div>
        </div>

        <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 self-start sm:self-auto">
          Step {currentStepNumber} of 3
        </span>
      </div>

      {/* 3 Step Pills */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Step 1: Spot the Threat */}
        <button
          type="button"
          onClick={() => onSelectTab('simulation')}
          className={`p-3.5 rounded-2xl border text-left transition flex items-start space-x-3 ${
            activeTab === 'simulation'
              ? 'bg-primary/10 border-primary/40'
              : 'bg-canvas border-border-subtle hover:border-text-muted/30'
          }`}
        >
          <div className="w-6 h-6 rounded-full bg-success/20 text-success flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
            ✓
          </div>
          <div>
            <span className="text-xs font-bold text-text-main block">
              1. Inspect Threat
            </span>
            <span className="text-[11px] text-text-muted block mt-0.5">
              See red attack packets in the Visual Circuit.
            </span>
          </div>
        </button>

        {/* Step 2: Fix the Flaw */}
        <button
          type="button"
          onClick={() => onSelectTab('configurator')}
          className={`p-3.5 rounded-2xl border text-left transition flex items-start space-x-3 ${
            isStep2Done
              ? 'bg-success/5 border-success/40'
              : activeTab === 'configurator'
              ? 'bg-primary/10 border-primary/40'
              : 'bg-canvas border-border-subtle hover:border-text-muted/30'
          }`}
        >
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
              isStep2Done
                ? 'bg-success text-white'
                : 'bg-primary/20 text-primary'
            }`}
          >
            {isStep2Done ? '✓' : '2'}
          </div>
          <div>
            <span className="text-xs font-bold text-text-main block">
              2. Apply Safe Fix
            </span>
            <span className="text-[11px] text-text-muted block mt-0.5">
              {isStep2Done ? 'Fix applied cleanly!' : 'Lock deadbolts or scope IPs.'}
            </span>
          </div>
        </button>

        {/* Step 3: Verify & Earn Badge */}
        <button
          type="button"
          onClick={() => onSelectTab('verification')}
          className={`p-3.5 rounded-2xl border text-left transition flex items-start space-x-3 ${
            isStep3Done
              ? 'bg-success/10 border-success/40'
              : activeTab === 'verification'
              ? 'bg-primary/10 border-primary/40'
              : 'bg-canvas border-border-subtle hover:border-text-muted/30'
          }`}
        >
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
              isStep3Done
                ? 'bg-success text-white'
                : 'bg-surface-secondary text-text-muted'
            }`}
          >
            {isStep3Done ? '✓' : '3'}
          </div>
          <div>
            <span className="text-xs font-bold text-text-main block">
              3. Claim Badge
            </span>
            <span className="text-[11px] text-text-muted block mt-0.5">
              {isStep3Done ? '100% Verified!' : 'Run check to score 100.'}
            </span>
          </div>
        </button>
      </div>

      {/* Dynamic Action Helper for the Current Step */}
      <div className="p-3.5 rounded-2xl bg-canvas border border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2">
          <span className="text-lg shrink-0">
            {isStep3Done ? '🏆' : isStep2Done ? '👉' : '💡'}
          </span>
          <p className="text-text-muted text-[11px]">
            {isStep3Done ? (
              <strong className="text-success">
                Congratulations! You scored 100/100. This grade is permanently saved on your Teacher Dashboard.
              </strong>
            ) : isStep2Done ? (
              <strong className="text-text-main">
                Awesome! Your safe configuration is active. Now click &quot;Run Verification&quot; to test your fix!
              </strong>
            ) : (
              <span className="text-text-main">
                Click <strong>&quot;Quick Apply Fix&quot;</strong> to apply the secure reference configuration instantly, or manually adjust the switches in Cloud Controls.
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0 self-end sm:self-auto">
          {!isStep2Done && (
            <button
              type="button"
              onClick={onApplyFix}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-accent text-white hover:bg-accent/90 shadow-xs transition"
            >
              ⚡ Quick Apply Fix
            </button>
          )}

          <button
            type="button"
            onClick={onRunVerification}
            className="inline-flex items-center space-x-1.5 px-4 py-1.5 rounded-xl text-xs font-bold bg-primary text-white hover:bg-primary-hover shadow-xs transition"
          >
            <Play className="h-3 w-3 fill-current" />
            <span>{isStep3Done ? 'Re-Verify (100/100)' : 'Run Verification'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
