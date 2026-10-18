'use client';

import React, { useState } from 'react';
import { InvestigationData, TelemetryLog } from '../types';
import {
  AlertCircle,
  FileSearch,
  Terminal,
  ShieldAlert,
  Clock,
  Layers,
  CheckCircle2,
  ChevronRight,
  Radio,
} from 'lucide-react';

interface Props {
  investigation: InvestigationData;
}

export function InvestigationInspector({ investigation }: Props) {
  const [selectedLogId, setSelectedLogId] = useState<string>(
    investigation.telemetryLogs[0]?.id || ''
  );

  const selectedLog =
    investigation.telemetryLogs.find((l) => l.id === selectedLogId) ||
    investigation.telemetryLogs[0];

  return (
    <div className="space-y-5">
      {/* Primary Cloud Alert Banner */}
      <div className="bg-surface border border-border-subtle rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border-subtle">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-danger/10 text-danger">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-text-main">
                  {investigation.alert.service}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-secondary text-text-muted border border-border-subtle">
                  {investigation.alert.alertId}
                </span>
              </div>
              <span className="text-[11px] text-text-muted flex items-center space-x-1 mt-0.5">
                <Clock className="h-3 w-3" />
                <span>Detected: {investigation.alert.timestamp}</span>
              </span>
            </div>
          </div>

          <span
            className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full self-start sm:self-auto ${
              investigation.alert.severity === 'critical'
                ? 'bg-danger/20 text-danger border border-danger/30'
                : 'bg-warning/20 text-warning border border-warning/30'
            }`}
          >
            {investigation.alert.severity} Severity
          </span>
        </div>

        <div className="mt-3">
          <h4 className="text-sm font-bold text-text-main">
            {investigation.alert.title}
          </h4>
          <p className="text-xs text-text-muted leading-relaxed mt-1">
            {investigation.alert.description}
          </p>
        </div>
      </div>

      {/* Forensic Evidence Checklist */}
      <div className="bg-surface border border-border-subtle rounded-2xl p-5 shadow-sm">
        <div className="flex items-center space-x-2 text-primary mb-3">
          <FileSearch className="h-4 w-4" />
          <h4 className="text-xs font-bold uppercase tracking-wider">
            Forensic Incident Evidence
          </h4>
        </div>

        <div className="space-y-2">
          {investigation.evidenceNotes.map((note, idx) => (
            <div
              key={idx}
              className="p-3 rounded-xl bg-surface-secondary/40 border border-border-subtle text-xs text-text-muted flex items-start space-x-2.5"
            >
              <div className="p-0.5 rounded-full bg-danger/10 text-danger mt-0.5 shrink-0">
                <Radio className="h-3 w-3" />
              </div>
              <span className="leading-relaxed">{note}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Cloud Telemetry & Raw Event Logs */}
      <div className="bg-surface border border-border-subtle rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
          <div className="flex items-center space-x-2 text-primary">
            <Terminal className="h-4 w-4" />
            <h4 className="text-xs font-bold uppercase tracking-wider">
              Simulated Cloud Telemetry Logs
            </h4>
          </div>
          <span className="text-[11px] text-text-muted">
            {investigation.telemetryLogs.length} Events Captured
          </span>
        </div>

        {/* Log Source Selector Pills */}
        <div className="mt-3 flex flex-wrap gap-2">
          {investigation.telemetryLogs.map((log) => (
            <button
              key={log.id}
              type="button"
              onClick={() => setSelectedLogId(log.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition flex items-center space-x-1.5 ${
                selectedLog?.id === log.id
                  ? 'bg-primary text-white border-primary shadow-sm'
                  : 'bg-surface-secondary/50 text-text-muted hover:text-text-main border-border-subtle'
              }`}
            >
              <span>{log.source}:</span>
              <span className="font-mono text-[11px]">{log.event}</span>
            </button>
          ))}
        </div>

        {/* Selected Raw Log Output */}
        {selectedLog && (
          <div className="mt-3.5">
            <div className="flex items-center justify-between text-[11px] text-text-muted mb-1 px-1">
              <span>Timestamp: {selectedLog.timestamp}</span>
              <span className="font-mono">Log Type: {selectedLog.source}</span>
            </div>
            <pre className="p-3.5 rounded-xl bg-canvas border border-border-subtle text-text-main font-mono text-[11px] leading-relaxed overflow-x-auto max-h-64 whitespace-pre-wrap">
              {selectedLog.rawJsonOrText}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
