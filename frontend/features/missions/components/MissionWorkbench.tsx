'use client';

import React, { useState } from 'react';
import {
  Mission,
  MissionState,
  VerificationResult,
  S3MissionConfig,
  SecurityGroupMissionConfig,
  IAMRoleMissionConfig,
} from '../types';
import { verifyMissionState } from '../engine/verifier';
import { MissionHeader } from './MissionHeader';
import { MissionBriefing } from './MissionBriefing';
import { VerificationPanel } from './VerificationPanel';
import { S3Configurator } from './configurators/S3Configurator';
import { SecurityGroupConfigurator } from './configurators/SecurityGroupConfigurator';
import { IAMRoleConfigurator } from './configurators/IAMRoleConfigurator';
import {
  Terminal,
  FileText,
  Play,
  RotateCcw,
  Sparkles,
  Award,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

interface Props {
  mission: Mission;
}

export function MissionWorkbench({ mission }: Props) {
  const [currentState, setCurrentState] = useState<MissionState>(
    mission.initialState
  );
  const [verificationResult, setVerificationResult] =
    useState<VerificationResult | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [unlockedHints, setUnlockedHints] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState<'configurator' | 'verification'>(
    'configurator'
  );

  const handleReset = () => {
    setCurrentState(JSON.parse(JSON.stringify(mission.initialState)));
    setVerificationResult(null);
    setActiveTab('configurator');
  };

  const handleApplyReferenceFix = () => {
    const fixed = JSON.parse(JSON.stringify(mission.recommendedState));
    setCurrentState(fixed);
    const result = verifyMissionState(mission.id, fixed);
    setVerificationResult(result);
    setActiveTab('verification');
  };

  const handleRunVerification = () => {
    setIsVerifying(true);
    setTimeout(() => {
      const result = verifyMissionState(mission.id, currentState);
      setVerificationResult(result);
      setIsVerifying(false);
      setActiveTab('verification');
    }, 200);
  };

  const handleUnlockHint = (hintId: number) => {
    if (!unlockedHints.includes(hintId)) {
      setUnlockedHints([...unlockedHints, hintId]);
    }
  };

  const handleS3Change = (updated: S3MissionConfig) => {
    setCurrentState({
      type: 's3',
      config: updated,
    });
  };

  const handleSgChange = (updated: SecurityGroupMissionConfig) => {
    setCurrentState({
      type: 'security-group',
      config: updated,
    });
  };

  const handleIamChange = (updated: IAMRoleMissionConfig) => {
    setCurrentState({
      type: 'iam-role',
      config: updated,
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-canvas transition-colors">
      {/* Sticky Mission Top Bar */}
      <MissionHeader
        mission={mission}
        verificationResult={verificationResult}
        isVerifying={isVerifying}
        onReset={handleReset}
        onApplyReferenceFix={handleApplyReferenceFix}
        onRunVerification={handleRunVerification}
      />

      {/* Main Workspace Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Briefing & Architecture (5 of 12 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <MissionBriefing
              mission={mission}
              unlockedHints={unlockedHints}
              onUnlockHint={handleUnlockHint}
            />
          </div>

          {/* Right Column: Interactive Configurator or Verification (7 of 12 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* View Switcher Bar */}
            <div className="bg-surface border border-border-subtle rounded-2xl p-2 flex items-center justify-between shadow-sm">
              <div className="flex items-center space-x-1 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setActiveTab('configurator')}
                  className={`flex-1 sm:flex-none inline-flex items-center justify-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                    activeTab === 'configurator'
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-text-muted hover:text-text-main hover:bg-surface-secondary'
                  }`}
                >
                  <Terminal className="h-4 w-4" />
                  <span>Cloud Configurator</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('verification')}
                  className={`flex-1 sm:flex-none inline-flex items-center justify-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                    activeTab === 'verification'
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-text-muted hover:text-text-main hover:bg-surface-secondary'
                  }`}
                >
                  <Award className="h-4 w-4" />
                  <span>
                    Verification Check
                    {verificationResult && (
                      <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 text-white font-mono">
                        {verificationResult.score}/100
                      </span>
                    )}
                  </span>
                </button>
              </div>

              <div className="hidden sm:flex items-center space-x-2 pr-2">
                <button
                  type="button"
                  onClick={handleRunVerification}
                  disabled={isVerifying}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-primary/10 hover:bg-primary text-primary hover:text-white transition disabled:opacity-50"
                >
                  <Play className="h-3 w-3 fill-current" />
                  <span>Verify Now</span>
                </button>
              </div>
            </div>

            {/* Viewport Content */}
            {activeTab === 'configurator' ? (
              <div>
                {currentState.type === 's3' && (
                  <S3Configurator
                    config={currentState.config}
                    onChange={handleS3Change}
                  />
                )}
                {currentState.type === 'security-group' && (
                  <SecurityGroupConfigurator
                    config={currentState.config}
                    onChange={handleSgChange}
                  />
                )}
                {currentState.type === 'iam-role' && (
                  <IAMRoleConfigurator
                    config={currentState.config}
                    onChange={handleIamChange}
                  />
                )}
              </div>
            ) : (
              <VerificationPanel
                mission={mission}
                verificationResult={verificationResult}
                isVerifying={isVerifying}
                onRunVerification={handleRunVerification}
                onApplyReferenceFix={handleApplyReferenceFix}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
