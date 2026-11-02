'use client';

import React, { useState, useEffect } from 'react';
import { S3MissionConfig } from '../../types';
import {
  ShieldCheck,
  ShieldAlert,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Lock,
  Unlock,
  AlertTriangle,
  FileText,
  Terminal,
} from 'lucide-react';

interface Props {
  config: S3MissionConfig;
  onApplyReferenceFix?: () => void;
}

export function S3VaultSimulation({ config, onApplyReferenceFix }: Props) {
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [simTick, setSimTick] = useState<number>(0);
  const [logMessages, setLogMessages] = useState<string[]>([]);

  const bpa = config.blockPublicAccess;
  const isFullyLocked =
    bpa.blockPublicAcls &&
    bpa.ignorePublicAcls &&
    bpa.blockPublicPolicy &&
    bpa.restrictPublicBuckets &&
    config.bucketAcl === 'private';

  // Simulation timer loop
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setSimTick((prev) => (prev + 1) % 100);
    }, 60);
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Generate real-time network traffic log ticker
  useEffect(() => {
    const timer = setInterval(() => {
      if (!isPlaying) return;
      const timestamp = new Date().toLocaleTimeString();
      const ip = `185.${Math.floor(Math.random() * 200 + 20)}.${Math.floor(
        Math.random() * 250
      )}.${Math.floor(Math.random() * 250)}`;

      if (isFullyLocked) {
        setLogMessages((prev) => [
          `[${timestamp}] 🛑 ${ip} GET /invoices.pdf -> 403 Forbidden (Blocked by S3 Deadbolts)`,
          `[${timestamp}] 🛡️ AppRole (10.0.4.12) GET /invoices.pdf -> 200 OK (Authorized IAM)`,
          ...prev.slice(0, 4),
        ]);
      } else {
        setLogMessages((prev) => [
          `[${timestamp}] 🚨 ${ip} GET /customer_invoices.pdf -> 200 OK (UNAUTHENTICATED PUBLIC READ!)`,
          `[${timestamp}] ⚠️ Bot Crawler downloaded 42MB of private invoices without login`,
          ...prev.slice(0, 4),
        ]);
      }
    }, 2400);

    return () => clearInterval(timer);
  }, [isPlaying, isFullyLocked]);

  // Calculate packet animated positions (0% to 100%)
  const attackerX = (simTick * 1.5) % 100;
  const isBlocked = isFullyLocked;

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
                isFullyLocked
                  ? 'bg-success/10 text-success border-success/30'
                  : 'bg-danger/10 text-danger border-danger/30 animate-pulse'
              }`}
            >
              {isFullyLocked ? '🛡️ Vault Sealed (Safe)' : '🚨 Vault Leaking Invoices!'}
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-text-main mt-1.5">
            Interactive S3 Storage Vault Simulation
          </h2>
          <p className="text-xs text-text-muted mt-0.5">
            Watch simulated internet traffic packets interact with your S3 security deadbolts in real time.
          </p>
        </div>

        {/* Simulation Controls */}
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
        {/* Animated Traffic Path (SVG) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center relative z-10">
          {/* Node 1: Public Internet & Attackers */}
          <div className="p-4 rounded-2xl bg-surface border border-border-subtle shadow-sm flex flex-col items-center text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-danger/10 text-danger flex items-center justify-center text-2xl">
              🌐
            </div>
            <div>
              <span className="font-bold text-xs text-text-main block">
                Public Internet & Bots
              </span>
              <span className="text-[10px] text-text-muted font-mono block">
                IP: 185.220.101.5 (Untrusted)
              </span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-danger/10 text-danger">
              GET /invoices.pdf
            </span>
          </div>

          {/* Node 2: The Security Deadbolts & Policy Filter */}
          <div
            className={`p-5 rounded-2xl border transition-all text-center space-y-3 ${
              isFullyLocked
                ? 'bg-success/5 border-success/40 shadow-sm'
                : 'bg-danger/5 border-danger/40 border-dashed'
            }`}
          >
            <div className="flex justify-center">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl transition-transform ${
                  isFullyLocked
                    ? 'bg-success/15 text-success scale-110'
                    : 'bg-danger/15 text-danger animate-bounce'
                }`}
              >
                {isFullyLocked ? '🔒' : '🔓'}
              </div>
            </div>

            <div>
              <span className="font-bold text-xs text-text-main block">
                {isFullyLocked ? '4 Deadbolts Engaged' : 'Vault Door Ajar'}
              </span>
              <span className="text-[10px] text-text-muted block mt-0.5">
                Block Public Access (BPA)
              </span>
            </div>

            {/* Status Indicator */}
            <div className="pt-2 border-t border-border-subtle/60 text-[11px] font-bold">
              {isFullyLocked ? (
                <span className="text-success flex items-center justify-center space-x-1">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>Attacks Deflected</span>
                </span>
              ) : (
                <span className="text-danger flex items-center justify-center space-x-1">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span>Allowing Public Downloads</span>
                </span>
              )}
            </div>
          </div>

          {/* Node 3: S3 Storage Vault */}
          <div
            className={`p-4 rounded-2xl border shadow-sm flex flex-col items-center text-center space-y-2 transition ${
              isFullyLocked
                ? 'bg-surface border-success/40'
                : 'bg-danger/5 border-danger/30'
            }`}
          >
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center text-2xl">
              🏦
            </div>
            <div>
              <span className="font-bold text-xs text-text-main block">
                {config.bucketName}
              </span>
              <span className="text-[10px] text-text-muted font-mono block">
                Customer Invoices (Confidential)
              </span>
            </div>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                isFullyLocked
                  ? 'bg-success/10 text-success'
                  : 'bg-danger/10 text-danger animate-pulse'
              }`}
            >
              {isFullyLocked ? 'Vault Protected' : 'Data Exposed!'}
            </span>
          </div>
        </div>

        {/* Live Packet Motion Visualization */}
        <div className="mt-8 pt-6 border-t border-border-subtle">
          <div className="flex items-center justify-between text-[11px] text-text-muted mb-2 font-mono">
            <span>PACKET FLOW: 185.220.101.5 ──► DEADBOLT ──► S3 VAULT</span>
            <span className="font-bold text-text-main">
              STATUS:{' '}
              {isFullyLocked ? (
                <span className="text-success">BLOCKED (403 FORBIDDEN)</span>
              ) : (
                <span className="text-danger">EXFILTRATING (200 OK)</span>
              )}
            </span>
          </div>

          {/* Animated Track */}
          <div className="relative w-full h-3 bg-surface-secondary rounded-full overflow-hidden border border-border-subtle">
            {/* Moving red packet */}
            {isPlaying && (
              <div
                className={`absolute top-0 bottom-0 w-8 rounded-full transition-all duration-75 ${
                  isFullyLocked
                    ? 'bg-success shadow-[0_0_8px_rgba(46,197,138,0.8)]'
                    : 'bg-danger shadow-[0_0_8px_rgba(239,122,102,0.8)]'
                }`}
                style={{
                  left: isFullyLocked
                    ? `${Math.min(attackerX, 48)}%`
                    : `${attackerX}%`,
                }}
              />
            )}
            {/* Barrier indicator */}
            <div className="absolute top-0 bottom-0 left-1/2 w-1 bg-text-muted/40" />
          </div>
        </div>
      </div>

      {/* Live Event Log Ticker */}
      <div className="bg-canvas border border-border-subtle rounded-2xl p-4 font-mono text-[11px] space-y-1.5">
        <div className="flex items-center space-x-1.5 text-text-muted pb-1 border-b border-border-subtle">
          <Terminal className="h-3.5 w-3.5" />
          <span className="font-bold uppercase tracking-wider text-[10px]">
            Real-time Traffic Ticker & CloudTrail Access Logs
          </span>
        </div>
        {logMessages.length > 0 ? (
          logMessages.map((msg, i) => (
            <p
              key={i}
              className={`truncate ${
                msg.includes('403') || msg.includes('Shield')
                  ? 'text-success'
                  : 'text-danger font-semibold'
              }`}
            >
              {msg}
            </p>
          ))
        ) : (
          <p className="text-text-muted italic">
            Starting packet simulation engine...
          </p>
        )}
      </div>
    </div>
  );
}
