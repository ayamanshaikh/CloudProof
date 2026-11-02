'use client';

import React, { useState, useEffect } from 'react';
import { SecurityGroupMissionConfig } from '../../types';
import {
  ShieldCheck,
  ShieldAlert,
  Play,
  Pause,
  AlertTriangle,
  Terminal,
  Network,
  Lock,
  Unlock,
} from 'lucide-react';

interface Props {
  config: SecurityGroupMissionConfig;
}

export function SecurityGroupGateSimulation({ config }: Props) {
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [simTick, setSimTick] = useState<number>(0);
  const [logMessages, setLogMessages] = useState<string[]>([]);

  // Check if port 22 is open to 0.0.0.0/0
  const hasWildcardSsh = config.inboundRules.some(
    (r) =>
      (r.protocol === 'all' || r.portRange === '22' || (r.fromPort <= 22 && r.toPort >= 22)) &&
      (r.source === '0.0.0.0/0' || r.source === '::/0')
  );

  const hasCampusSsh = config.inboundRules.some(
    (r) =>
      (r.portRange === '22' || (r.fromPort <= 22 && r.toPort >= 22)) &&
      (r.source === '198.51.100.0/24' || r.source.startsWith('198.51.') || r.source.startsWith('203.0.'))
  );

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

      if (hasWildcardSsh) {
        setLogMessages((prev) => [
          `[${timestamp}] 🚨 Botnet 185.220.101.5 -> Port 22 SSH -> ACCEPT (Brute force dictionary attack in progress!)`,
          `[${timestamp}] ⚠️ External scanner detected open port 22 from 0.0.0.0/0`,
          ...prev.slice(0, 4),
        ]);
      } else {
        setLogMessages((prev) => [
          `[${timestamp}] 🛑 Botnet 185.220.101.5 -> Port 22 SSH -> REJECT (Untrusted CIDR Blocked)`,
          `[${timestamp}] ✅ Student 198.51.100.42 -> Port 80 HTTP -> ACCEPT (Campus Web Traffic OK)`,
          ...prev.slice(0, 4),
        ]);
      }
    }, 2400);

    return () => clearInterval(timer);
  }, [isPlaying, hasWildcardSsh]);

  const botX = (simTick * 1.5) % 100;

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
                !hasWildcardSsh
                  ? 'bg-success/10 text-success border-success/30'
                  : 'bg-danger/10 text-danger border-danger/30 animate-pulse'
              }`}
            >
              {!hasWildcardSsh
                ? '🛡️ Gatekeeper Secured (Campus Network Only)'
                : '🚨 Gatekeeper Backdoor Exposed to World!'}
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-text-main mt-1.5">
            Interactive VPC Firewall Gatekeeper Simulation
          </h2>
          <p className="text-xs text-text-muted mt-0.5">
            Watch incoming network packets test your Security Group ingress firewall in real time.
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
          {/* Node 1: Incoming Sources */}
          <div className="space-y-3">
            <div className="p-3.5 rounded-2xl bg-surface border border-border-subtle shadow-sm flex items-center space-x-3">
              <span className="text-2xl">🤖</span>
              <div>
                <span className="font-bold text-xs text-danger block">
                  Internet Botnet Scanner
                </span>
                <span className="text-[10px] text-text-muted font-mono block">
                  185.220.101.5 (Untrusted)
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-surface border border-border-subtle shadow-sm flex items-center space-x-3">
              <span className="text-2xl">👨‍🎓</span>
              <div>
                <span className="font-bold text-xs text-success block">
                  College Campus Student
                </span>
                <span className="text-[10px] text-text-muted font-mono block">
                  198.51.100.42 (Campus WiFi)
                </span>
              </div>
            </div>
          </div>

          {/* Node 2: The Security Group Gatekeeper */}
          <div
            className={`p-5 rounded-2xl border transition-all text-center space-y-3 ${
              !hasWildcardSsh
                ? 'bg-success/5 border-success/40 shadow-sm'
                : 'bg-danger/5 border-danger/40 border-dashed'
            }`}
          >
            <div className="flex justify-center">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl transition-transform ${
                  !hasWildcardSsh
                    ? 'bg-success/15 text-success scale-110'
                    : 'bg-danger/15 text-danger animate-bounce'
                }`}
              >
                {!hasWildcardSsh ? '🏰' : '🚪'}
              </div>
            </div>

            <div>
              <span className="font-bold text-xs text-text-main block">
                {!hasWildcardSsh ? 'SSH Gate Secured' : 'Port 22 Backdoor Open'}
              </span>
              <span className="text-[10px] text-text-muted block mt-0.5 font-mono">
                {config.securityGroupId}
              </span>
            </div>

            {/* Ports Status */}
            <div className="pt-2 border-t border-border-subtle/60 flex justify-center space-x-2 text-[10px] font-bold">
              <span
                className={`px-1.5 py-0.5 rounded ${
                  hasWildcardSsh
                    ? 'bg-danger/10 text-danger'
                    : 'bg-success/10 text-success'
                }`}
              >
                Port 22 (SSH): {!hasWildcardSsh ? 'Protected' : 'OPEN TO WORLD'}
              </span>
            </div>
          </div>

          {/* Node 3: EC2 Linux Cloud Server */}
          <div
            className={`p-4 rounded-2xl border shadow-sm flex flex-col items-center text-center space-y-2 transition ${
              !hasWildcardSsh
                ? 'bg-surface border-success/40'
                : 'bg-danger/5 border-danger/30'
            }`}
          >
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center text-2xl">
              💻
            </div>
            <div>
              <span className="font-bold text-xs text-text-main block">
                i-0abcd1234efgh5678
              </span>
              <span className="text-[10px] text-text-muted font-mono block">
                Production Linux Server
              </span>
            </div>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                !hasWildcardSsh
                  ? 'bg-success/10 text-success'
                  : 'bg-danger/10 text-danger animate-pulse'
              }`}
            >
              {!hasWildcardSsh ? 'Server Secure' : 'Brute Force Vulnerable!'}
            </span>
          </div>
        </div>

        {/* Live Packet Motion Visualization */}
        <div className="mt-8 pt-6 border-t border-border-subtle">
          <div className="flex items-center justify-between text-[11px] text-text-muted mb-2 font-mono">
            <span>PACKET FLOW: BOTNET ──► SECURITY GROUP ──► EC2 SERVER</span>
            <span className="font-bold text-text-main">
              STATUS:{' '}
              {!hasWildcardSsh ? (
                <span className="text-success">BLOCKED (UNTRUSTED CIDR DROPPED)</span>
              ) : (
                <span className="text-danger">EXPOSING SHELL (22/TCP ACCEPT)</span>
              )}
            </span>
          </div>

          {/* Animated Track */}
          <div className="relative w-full h-3 bg-surface-secondary rounded-full overflow-hidden border border-border-subtle">
            {isPlaying && (
              <div
                className={`absolute top-0 bottom-0 w-8 rounded-full transition-all duration-75 ${
                  !hasWildcardSsh
                    ? 'bg-success shadow-[0_0_8px_rgba(46,197,138,0.8)]'
                    : 'bg-danger shadow-[0_0_8px_rgba(239,122,102,0.8)]'
                }`}
                style={{
                  left: !hasWildcardSsh
                    ? `${Math.min(botX, 48)}%`
                    : `${botX}%`,
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
            Real-time VPC Flow Logs & Ingress Firewall Telemetry
          </span>
        </div>
        {logMessages.map((msg, i) => (
          <p
            key={i}
            className={`truncate ${
              msg.includes('REJECT') || msg.includes('Campus')
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
