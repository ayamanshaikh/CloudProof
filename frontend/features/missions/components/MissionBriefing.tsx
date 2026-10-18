'use client';

import React, { useState } from 'react';
import { Mission } from '../types';
import { InvestigationInspector } from './InvestigationInspector';
import {
  FileText,
  AlertCircle,
  Server,
  CheckCircle2,
  Lightbulb,
  Tag,
  Eye,
  FileSearch,
} from 'lucide-react';

interface Props {
  mission: Mission;
  unlockedHints: number[];
  onUnlockHint: (hintId: number) => void;
}

export function MissionBriefing({
  mission,
  unlockedHints,
  onUnlockHint,
}: Props) {
  const [briefingTab, setBriefingTab] = useState<'brief' | 'telemetry'>('brief');

  return (
    <div className="space-y-5">
      {/* Sub-tab navigation */}
      <div className="bg-surface border border-border-subtle rounded-2xl p-1.5 flex items-center space-x-1 shadow-sm">
        <button
          type="button"
          onClick={() => setBriefingTab('brief')}
          className={`flex-1 inline-flex items-center justify-center space-x-2 py-2 px-3 rounded-xl text-xs font-bold transition ${
            briefingTab === 'brief'
              ? 'bg-primary text-white shadow-sm'
              : 'text-text-muted hover:text-text-main hover:bg-surface-secondary'
          }`}
        >
          <FileText className="h-3.5 w-3.5" />
          <span>Incident Brief & Goals</span>
        </button>

        {mission.investigation && (
          <button
            type="button"
            onClick={() => setBriefingTab('telemetry')}
            className={`flex-1 inline-flex items-center justify-center space-x-2 py-2 px-3 rounded-xl text-xs font-bold transition ${
              briefingTab === 'telemetry'
                ? 'bg-primary text-white shadow-sm'
                : 'text-text-muted hover:text-text-main hover:bg-surface-secondary'
            }`}
          >
            <FileSearch className="h-3.5 w-3.5" />
            <span>Telemetry & Logs</span>
          </button>
        )}
      </div>

      {briefingTab === 'telemetry' && mission.investigation ? (
        <InvestigationInspector investigation={mission.investigation} />
      ) : (
        <>
          {/* Scenario Briefing Card */}
          <div className="bg-surface border border-border-subtle rounded-2xl p-6 shadow-sm">
            <div className="flex items-center space-x-2 text-primary mb-3">
              <FileText className="h-4 w-4" />
              <h2 className="text-sm font-bold uppercase tracking-wider">
                Incident Briefing
              </h2>
            </div>

            <h3 className="text-lg font-bold text-text-main mb-2">
              {mission.subtitle}
            </h3>

            <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
              {mission.scenarioDescription}
            </p>

            {/* Security Hub / CloudTrail Alert Box */}
            <div className="mt-4 p-3.5 rounded-xl bg-danger/5 border border-danger/20 flex items-start space-x-3">
              <AlertCircle className="h-4 w-4 text-danger shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-danger block">
                  Automated Incident Alert Detected
                </span>
                <p className="text-[11px] text-text-muted leading-relaxed mt-0.5 font-mono">
                  {mission.incidentBackground}
                </p>
              </div>
            </div>
          </div>

          {/* Architecture & Cloud Metadata Card */}
          <div className="bg-surface border border-border-subtle rounded-2xl p-6 shadow-sm">
            <div className="flex items-center space-x-2 text-primary mb-3">
              <Server className="h-4 w-4" />
              <h2 className="text-sm font-bold uppercase tracking-wider">
                Simulated Infrastructure Target
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-surface-secondary/50 border border-border-subtle">
                <span className="text-text-muted block text-[11px]">Component</span>
                <span className="font-bold text-text-main mt-0.5 block">
                  {mission.architectureOverview.component}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-surface-secondary/50 border border-border-subtle">
                <span className="text-text-muted block text-[11px]">AWS Region</span>
                <span className="font-mono font-bold text-text-main mt-0.5 block">
                  {mission.architectureOverview.region}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-surface-secondary/50 border border-border-subtle sm:col-span-2">
                <span className="text-text-muted block text-[11px]">Target Resource Identifier</span>
                <span className="font-mono text-xs font-bold text-primary mt-0.5 block break-all">
                  {mission.architectureOverview.resourceId}
                </span>
              </div>
            </div>

            {/* AWS Resource Tags */}
            <div className="mt-4 pt-3 border-t border-border-subtle">
              <div className="flex items-center space-x-1.5 text-xs text-text-muted mb-2">
                <Tag className="h-3.5 w-3.5" />
                <span className="font-semibold">Resource Tags:</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(mission.architectureOverview.tags).map(([k, v]) => (
                  <span
                    key={k}
                    className="font-mono text-[10px] px-2 py-0.5 rounded-md bg-canvas border border-border-subtle text-text-muted"
                  >
                    <strong className="text-text-main">{k}:</strong> {v}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Learning Objectives Checklist */}
          <div className="bg-surface border border-border-subtle rounded-2xl p-6 shadow-sm">
            <div className="flex items-center space-x-2 text-primary mb-3">
              <CheckCircle2 className="h-4 w-4" />
              <h2 className="text-sm font-bold uppercase tracking-wider">
                Learning Objectives
              </h2>
            </div>

            <div className="space-y-2.5">
              {mission.learningObjectives.map((obj) => (
                <div
                  key={obj.id}
                  className="p-3 rounded-xl bg-surface-secondary/40 border border-border-subtle flex items-start space-x-3"
                >
                  <div className="p-1 rounded-full bg-primary/10 text-primary mt-0.5 shrink-0">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-text-main block">
                      {obj.title}
                    </span>
                    <p className="text-[11px] text-text-muted leading-relaxed mt-0.5">
                      {obj.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Progressive Hints Drawer */}
          <div className="bg-surface border border-border-subtle rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2 text-accent">
                <Lightbulb className="h-4 w-4" />
                <h2 className="text-sm font-bold uppercase tracking-wider">
                  Diagnostic Hints ({unlockedHints.length}/{mission.hints.length} Unlocked)
                </h2>
              </div>
              <span className="text-[11px] text-text-muted">
                Penalty subtracted from overall score
              </span>
            </div>

            <div className="space-y-2.5">
              {mission.hints.map((hint) => {
                const isUnlocked = unlockedHints.includes(hint.id);
                return (
                  <div
                    key={hint.id}
                    className={`p-3.5 rounded-xl border transition ${
                      isUnlocked
                        ? 'bg-accent/5 border-accent/30'
                        : 'bg-surface-secondary/40 border-border-subtle'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-text-main">
                          Hint #{hint.id}: {hint.title}
                        </span>
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-warning/10 text-warning">
                          -{hint.penaltyPoints} pts
                        </span>
                      </div>

                      {!isUnlocked ? (
                        <button
                          type="button"
                          onClick={() => onUnlockHint(hint.id)}
                          className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-accent/10 text-accent hover:bg-accent hover:text-white transition"
                        >
                          <Eye className="h-3 w-3" />
                          <span>Reveal Hint</span>
                        </button>
                      ) : (
                        <span className="text-[10px] font-semibold text-accent uppercase tracking-wider">
                          Unlocked
                        </span>
                      )}
                    </div>

                    {isUnlocked && (
                      <p className="text-xs text-text-muted leading-relaxed mt-2 pt-2 border-t border-accent/20">
                        {hint.text}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
