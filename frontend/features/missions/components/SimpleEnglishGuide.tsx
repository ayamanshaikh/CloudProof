'use client';

import React from 'react';
import { MetaphorGuide } from '../data/metaphors';
import {
  Sparkles,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  DollarSign,
  AlertTriangle,
  HelpCircle,
} from 'lucide-react';

interface Props {
  guide: MetaphorGuide;
}

export function SimpleEnglishGuide({ guide }: Props) {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Friendly Real-World Analogy Hero Card */}
      <div className="bg-surface border-2 border-primary/20 rounded-3xl p-6 sm:p-7 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />

        <div className="flex items-center space-x-2 text-primary font-bold text-xs uppercase tracking-wider mb-2">
          <Sparkles className="h-4 w-4" />
          <span>Tinkercad-Style Visual Analogy</span>
        </div>

        <div className="flex items-start space-x-4 mb-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center text-3xl shrink-0 shadow-xs">
            {guide.objectMetaphor.icon}
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-text-main tracking-tight">
              {guide.simpleTitle}
            </h2>
            <p className="text-xs font-semibold text-primary mt-0.5">
              &ldquo;{guide.analogyTagline}&rdquo;
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-canvas border border-border-subtle text-xs sm:text-sm text-text-muted leading-relaxed">
          <p className="font-medium text-text-main mb-1 flex items-center space-x-1.5">
            <span>📖</span>
            <span className="font-bold">The Story:</span>
          </p>
          {guide.analogyStory}
        </div>

        {/* Why AWS Billing Matters Callout */}
        <div className="mt-4 p-3.5 rounded-2xl bg-accent/10 border border-accent/20 flex items-start space-x-3 text-xs">
          <DollarSign className="h-4 w-4 text-accent shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-accent block">
              Why Faculty Care & How Real AWS Billing Bites:
            </span>
            <p className="text-text-muted text-[11px] leading-relaxed mt-0.5">
              {guide.whyAwsBillingMatters}
            </p>
          </div>
        </div>
      </div>

      {/* Jargon Translator: AWS Speak -> Plain English */}
      <div className="bg-surface border border-border-subtle rounded-3xl p-6 shadow-sm">
        <div className="flex items-center space-x-2 text-primary font-bold text-xs uppercase tracking-wider mb-4">
          <BookOpen className="h-4 w-4" />
          <span>Jargon Translator: Cloud Terms in Plain English</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {guide.jargonDictionary.map((item, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl bg-canvas border border-border-subtle flex flex-col justify-between space-y-2"
            >
              <div>
                <span className="text-[10px] font-bold font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-surface-secondary text-text-muted block w-fit mb-1">
                  {item.technicalTerm}
                </span>
                <span className="text-xs font-black text-primary block">
                  👉 {item.plainEnglish}
                </span>
              </div>
              <p className="text-[11px] text-text-muted leading-relaxed pt-1 border-t border-border-subtle/50">
                {item.whyItMatters}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Step-by-Step Beginner Playbook */}
      <div className="bg-surface border border-border-subtle rounded-3xl p-6 shadow-sm">
        <div className="flex items-center space-x-2 text-primary font-bold text-xs uppercase tracking-wider mb-4">
          <CheckCircle2 className="h-4 w-4" />
          <span>3-Step Quick Fix Playbook</span>
        </div>

        <div className="space-y-3">
          {guide.stepByStepPlaybook.map((step) => (
            <div
              key={step.stepNumber}
              className="p-3.5 rounded-2xl bg-surface-secondary/40 border border-border-subtle flex items-start space-x-3.5"
            >
              <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 shadow-xs">
                {step.stepNumber}
              </div>
              <div>
                <span className="text-xs font-bold text-text-main block">
                  {step.actionTitle}
                </span>
                <p className="text-[11px] text-text-muted leading-relaxed mt-0.5">
                  {step.simpleExplanation}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
