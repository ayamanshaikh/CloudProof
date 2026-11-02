'use client';

import React, { useState, useEffect } from 'react';
import { IAMRoleMissionConfig, IAMPolicyDocument, IAMStatement } from '../../types';
import {
  ShieldCheck,
  ShieldAlert,
  Play,
  Pause,
  AlertTriangle,
  Terminal,
  Key,
} from 'lucide-react';

interface Props {
  config: IAMRoleMissionConfig;
}

export function IAMKeycardSimulation({ config }: Props) {
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [simTick, setSimTick] = useState<number>(0);
  const [logMessages, setLogMessages] = useState<string[]>([]);

  const activePolicy = config.inlinePolicies[0] || {
    id: 'default',
    name: 'Policy',
    policyDocument: '{}',
  };

  let hasWildcardAction = false;
  let hasWildcardResource = false;
  try {
    const doc: IAMPolicyDocument = JSON.parse(activePolicy.policyDocument);
    const statements: IAMStatement[] = Array.isArray(doc.Statement)
      ? doc.Statement
      : [];
    for (const stmt of statements) {
      if (stmt.Effect === 'Allow') {
        const acts = Array.isArray(stmt.Action) ? stmt.Action : [stmt.Action];
        if (acts.includes('*') || acts.includes('*:*')) hasWildcardAction = true;
        const res = Array.isArray(stmt.Resource) ? stmt.Resource : [stmt.Resource];
        if (res.includes('*')) hasWildcardResource = true;
      }
    }
  } catch {
    // ignore
  }

  const isLeastPrivilege = !hasWildcardAction && !hasWildcardResource;

  // Simulation timer loop
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setSimTick((prev) => (prev + 1) % 100);
    }, 60);
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Traffic log ticker
  useEffect(() => {
    const timer = setInterval(() => {
      if (!isPlaying) return;
      const timestamp = new Date().toLocaleTimeString();

      if (!isLeastPrivilege) {
        setLogMessages((prev) => [
          `[${timestamp}] 🚨 Worker -> dynamodb:DeleteTable "PayrollRecords" -> ALLOW (Over-privileged Wildcard!)`,
          `[${timestamp}] ⚠️ Master Skeleton Key used: "Action": "*", "Resource": "*" allows full cloud takeover`,
          ...prev.slice(0, 4),
        ]);
      } else {
        setLogMessages((prev) => [
          `[${timestamp}] 🛑 Worker -> dynamodb:DeleteTable "PayrollRecords" -> AccessDenied (Not in policy)`,
          `[${timestamp}] ✅ Worker -> s3:GetObject "fintech-customer-invoices/*" -> ALLOW (Authorized Scope)`,
          ...prev.slice(0, 4),
        ]);
      }
    }, 2400);

    return () => clearInterval(timer);
  }, [isPlaying, isLeastPrivilege]);

  const packetX = (simTick * 1.5) % 100;

  return (
    <div className="bg-surface border border-border-subtle rounded-3xl p-6 sm:p-7 shadow-sm space-y-6">
      {/* Simulation Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-border-subtle">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded-full">
              Tinkercad Circuits for Cloud
            </span>
            <span
              className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                isLeastPrivilege
                  ? 'bg-success/10 text-success border-success/30'
                  : 'bg-danger/10 text-danger border-danger/30 animate-pulse'
              }`}
            >
              {isLeastPrivilege
                ? '🛡️ Keycard Scoped (Least Privilege)'
                : '🚨 Master Skeleton Key Active!'}
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-text-main mt-1.5">
            Interactive IAM Keycard & Permission Station
          </h2>
          <p className="text-xs text-text-muted mt-0.5">
            Watch simulated application requests test your IAM policy boundaries against company resources.
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-xs ${
              isPlaying
                ? 'bg-surface-secondary text-text-main border border-border-subtle hover:bg-canvas'
                : 'bg-primary text-white hover:bg-primary-hover'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="h-3.5 w-3.5" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>Start Simulation</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Visual Canvas Diagram */}
      <div className="relative bg-canvas/70 border border-border-subtle rounded-2xl p-6 sm:p-8 min-h-[300px] flex flex-col justify-between overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center relative z-10">
          {/* Node 1: Worker Lambda */}
          <div className="p-4 rounded-2xl bg-surface border border-border-subtle shadow-sm flex flex-col items-center text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center text-2xl">
              ⚡
            </div>
            <div>
              <span className="font-bold text-xs text-text-main block">
                InvoiceWorkerLambda
              </span>
              <span className="text-[10px] text-text-muted font-mono block">
                Backend Microservice
              </span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-surface-secondary text-text-muted">
              Wants to read invoices
            </span>
          </div>

          {/* Node 2: Keycard Station */}
          <div
            className={`p-5 rounded-2xl border transition-all text-center space-y-3 ${
              isLeastPrivilege
                ? 'bg-success/5 border-success/40 shadow-sm'
                : 'bg-danger/5 border-danger/40 border-dashed'
            }`}
          >
            <div className="flex justify-center">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl transition-transform ${
                  isLeastPrivilege
                    ? 'bg-success/15 text-success scale-110'
                    : 'bg-danger/15 text-danger animate-bounce'
                }`}
              >
                {isLeastPrivilege ? '🪪' : '🗝️'}
              </div>
            </div>

            <div>
              <span className="font-bold text-xs text-text-main block">
                {isLeastPrivilege
                  ? 'Invoice-Only Keycard'
                  : 'Master Skeleton Key (*)'}
              </span>
              <span className="text-[10px] text-text-muted block mt-0.5 font-mono">
                {config.roleName}
              </span>
            </div>

            <div className="pt-2 border-t border-border-subtle/60 text-[11px] font-bold">
              {isLeastPrivilege ? (
                <span className="text-success flex items-center justify-center space-x-1">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>Only Invoice Vault Accessible</span>
                </span>
              ) : (
                <span className="text-danger flex items-center justify-center space-x-1">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span>Unrestricted Cloud Access!</span>
                </span>
              )}
            </div>
          </div>

          {/* Node 3: Target Resources */}
          <div className="space-y-3">
            <div
              className={`p-3 rounded-2xl border shadow-sm flex items-center space-x-3 transition ${
                isLeastPrivilege
                  ? 'bg-surface border-success/40'
                  : 'bg-danger/5 border-danger/30'
              }`}
            >
              <span className="text-2xl">📦</span>
              <div>
                <span className="font-bold text-xs text-text-main block">
                  Invoice S3 Bucket
                </span>
                <span className="text-[10px] text-success font-semibold block">
                  Authorized Work Target
                </span>
              </div>
            </div>

            <div
              className={`p-3 rounded-2xl border shadow-sm flex items-center space-x-3 transition ${
                isLeastPrivilege
                  ? 'bg-surface border-border-subtle opacity-70'
                  : 'bg-danger/10 border-danger/40 animate-pulse'
              }`}
            >
              <span className="text-2xl">💰</span>
              <div>
                <span className="font-bold text-xs text-text-main block">
                  Company Payroll Database
                </span>
                <span
                  className={`text-[10px] font-semibold block ${
                    isLeastPrivilege ? 'text-text-muted' : 'text-danger font-bold'
                  }`}
                >
                  {isLeastPrivilege
                    ? 'Protected (Access Denied)'
                    : 'Vulnerable to Deletion!'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Live Packet Motion Visualization */}
        <div className="mt-8 pt-6 border-t border-border-subtle">
          <div className="flex items-center justify-between text-[11px] text-text-muted mb-2 font-mono">
            <span>KEYCARD CHECK: LAMBDA ──► KEYCARD BADGE ──► RESOURCE</span>
            <span className="font-bold text-text-main">
              STATUS:{' '}
              {isLeastPrivilege ? (
                <span className="text-success">RESTRICTED (LEAST PRIVILEGE)</span>
              ) : (
                <span className="text-danger">UNRESTRICTED WILDCARD (*)</span>
              )}
            </span>
          </div>

          <div className="relative w-full h-3 bg-surface-secondary rounded-full overflow-hidden border border-border-subtle">
            {isPlaying && (
              <div
                className={`absolute top-0 bottom-0 w-8 rounded-full transition-all duration-75 ${
                  isLeastPrivilege
                    ? 'bg-success shadow-[0_0_8px_rgba(46,197,138,0.8)]'
                    : 'bg-danger shadow-[0_0_8px_rgba(239,122,102,0.8)]'
                }`}
                style={{
                  left: isLeastPrivilege
                    ? `${Math.min(packetX, 48)}%`
                    : `${packetX}%`,
                }}
              />
            )}
            <div className="absolute top-0 bottom-0 left-1/2 w-1 bg-text-muted/40" />
          </div>
        </div>
      </div>

      {/* Log Ticker */}
      <div className="bg-canvas border border-border-subtle rounded-2xl p-4 font-mono text-[11px] space-y-1.5">
        <div className="flex items-center space-x-1.5 text-text-muted pb-1 border-b border-border-subtle">
          <Terminal className="h-3.5 w-3.5" />
          <span className="font-bold uppercase tracking-wider text-[10px]">
            Real-time AWS CloudTrail Authorization Log
          </span>
        </div>
        {logMessages.map((msg, i) => (
          <p
            key={i}
            className={`truncate ${
              msg.includes('AccessDenied') || msg.includes('Scope')
                ? 'text-success'
                : 'text-danger font-semibold'
            }`}
          >
            {msg}
          </p>
        ))}
      </div>
    </div>
  );
}
