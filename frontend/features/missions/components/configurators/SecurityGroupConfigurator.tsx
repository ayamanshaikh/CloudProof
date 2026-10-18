'use client';

import React, { useState } from 'react';
import {
  SecurityGroupMissionConfig,
  SecurityGroupRule,
} from '../../types';
import {
  Network,
  ShieldAlert,
  ShieldCheck,
  Plus,
  Trash2,
  AlertTriangle,
  Info,
  CheckCircle2,
} from 'lucide-react';

interface Props {
  config: SecurityGroupMissionConfig;
  onChange: (updated: SecurityGroupMissionConfig) => void;
}

export function SecurityGroupConfigurator({ config, onChange }: Props) {
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);

  // Check if port 22 is open to 0.0.0.0/0
  const hasWildcardSsh = config.inboundRules.some(
    (r) =>
      (r.protocol === 'all' || r.portRange === '22' || (r.fromPort <= 22 && r.toPort >= 22)) &&
      (r.source === '0.0.0.0/0' || r.source === '::/0')
  );

  const handleUpdateSource = (ruleId: string, newSource: string) => {
    const updated = config.inboundRules.map((rule) => {
      if (rule.id === ruleId) {
        return { ...rule, source: newSource };
      }
      return rule;
    });
    onChange({
      ...config,
      inboundRules: updated,
    });
  };

  const handleDeleteRule = (ruleId: string) => {
    const updated = config.inboundRules.filter((r) => r.id !== ruleId);
    onChange({
      ...config,
      inboundRules: updated,
    });
  };

  const handleAddRule = () => {
    const newId = `rule-${Date.now()}`;
    const newRule: SecurityGroupRule = {
      id: newId,
      protocol: 'tcp',
      portRange: '22',
      fromPort: 22,
      toPort: 22,
      source: '203.0.113.50/32',
      description: 'Restricted administrative SSH access',
    };
    onChange({
      ...config,
      inboundRules: [...config.inboundRules, newRule],
    });
  };

  const handleQuickFixSsh = () => {
    const updated = config.inboundRules.map((rule) => {
      if (
        rule.protocol === 'all' ||
        rule.portRange === '22' ||
        (rule.fromPort <= 22 && rule.toPort >= 22)
      ) {
        return {
          ...rule,
          source: '203.0.113.50/32',
          description: 'Secured corporate admin bastion SSH',
        };
      }
      return rule;
    });
    onChange({
      ...config,
      inboundRules: updated,
    });
  };

  const handleRemoveSsh = () => {
    const updated = config.inboundRules.filter(
      (rule) =>
        !(
          rule.protocol === 'all' ||
          rule.portRange === '22' ||
          (rule.fromPort <= 22 && rule.toPort >= 22)
        )
    );
    onChange({
      ...config,
      inboundRules: updated,
    });
  };

  const handleRestoreWeb = () => {
    const existing = [...config.inboundRules];
    const has80 = existing.some((r) => r.portRange === '80' && r.source === '0.0.0.0/0');
    const has443 = existing.some((r) => r.portRange === '443' && r.source === '0.0.0.0/0');

    if (!has80) {
      existing.push({
        id: `rule-http-${Date.now()}`,
        protocol: 'tcp',
        portRange: '80',
        fromPort: 80,
        toPort: 80,
        source: '0.0.0.0/0',
        description: 'Public HTTP web traffic',
      });
    }
    if (!has443) {
      existing.push({
        id: `rule-https-${Date.now()}`,
        protocol: 'tcp',
        portRange: '443',
        fromPort: 443,
        toPort: 443,
        source: '0.0.0.0/0',
        description: 'Public HTTPS web traffic',
      });
    }

    onChange({
      ...config,
      inboundRules: existing,
    });
  };

  return (
    <div className="space-y-6">
      {/* Security Group Header */}
      <div className="bg-surface border border-border-subtle rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <Network className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-mono text-sm font-bold text-text-main">
                  {config.securityGroupId}
                </span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-surface-secondary text-text-muted border border-border-subtle">
                  {config.securityGroupName}
                </span>
              </div>
              <span className="text-xs text-text-muted block mt-0.5">
                VPC ID: <code className="font-mono">{config.vpcId}</code> &bull; Stateful Virtual Firewall
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-2 self-start sm:self-auto">
            {!hasWildcardSsh ? (
              <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-success/10 text-success border border-success/20">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>SSH Ingress Secured</span>
              </span>
            ) : (
              <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-danger/10 text-danger border border-danger/20">
                <ShieldAlert className="h-3.5 w-3.5" />
                <span>Port 22 Open to 0.0.0.0/0</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Inbound Rules Section */}
      <div className="bg-surface border border-border-subtle rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-border-subtle gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base font-bold text-text-main">
                Inbound Firewall Rules (Ingress)
              </h3>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-surface-secondary text-text-muted">
                {config.inboundRules.length} Rules
              </span>
            </div>
            <p className="text-xs text-text-muted mt-1">
              Stateful ingress rules controlling inbound traffic allowed to reach attached network interfaces.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleQuickFixSsh}
              className="px-2.5 py-1 rounded-md text-xs font-semibold bg-primary/10 text-primary hover:bg-primary hover:text-white transition"
            >
              Restrict SSH to 203.0.113.50/32
            </button>
            <button
              type="button"
              onClick={handleRemoveSsh}
              className="px-2.5 py-1 rounded-md text-xs font-medium text-text-muted bg-surface-secondary hover:bg-canvas border border-border-subtle transition"
            >
              Remove SSH (SSM Mode)
            </button>
            <button
              type="button"
              onClick={handleRestoreWeb}
              className="px-2.5 py-1 rounded-md text-xs font-medium text-text-muted bg-surface-secondary hover:bg-canvas border border-border-subtle transition"
            >
              Restore Web (80/443)
            </button>
            <button
              type="button"
              onClick={handleAddRule}
              className="inline-flex items-center space-x-1 px-3 py-1 rounded-md text-xs font-semibold bg-primary text-white hover:bg-primary-hover transition"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Rule</span>
            </button>
          </div>
        </div>

        {/* Rules Table */}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border-subtle text-text-muted">
                <th className="py-2.5 px-3 font-semibold">Type</th>
                <th className="py-2.5 px-3 font-semibold">Protocol</th>
                <th className="py-2.5 px-3 font-semibold">Port Range</th>
                <th className="py-2.5 px-3 font-semibold">Source CIDR</th>
                <th className="py-2.5 px-3 font-semibold">Description</th>
                <th className="py-2.5 px-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {config.inboundRules.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-text-muted">
                    No inbound rules defined. All incoming traffic is blocked by default.
                  </td>
                </tr>
              ) : (
                config.inboundRules.map((rule) => {
                  const isSsh =
                    rule.portRange === '22' ||
                    rule.protocol === 'all' ||
                    (rule.fromPort <= 22 && rule.toPort >= 22);
                  const isWildcard = rule.source === '0.0.0.0/0' || rule.source === '::/0';
                  const isDangerous = isSsh && isWildcard;

                  return (
                    <tr
                      key={rule.id}
                      className={`transition ${
                        isDangerous ? 'bg-danger/5' : 'hover:bg-surface-secondary/40'
                      }`}
                    >
                      <td className="py-3 px-3 font-medium text-text-main">
                        {rule.portRange === '22'
                          ? 'SSH'
                          : rule.portRange === '80'
                          ? 'HTTP'
                          : rule.portRange === '443'
                          ? 'HTTPS'
                          : 'Custom TCP'}
                      </td>
                      <td className="py-3 px-3 uppercase font-mono text-text-muted">
                        {rule.protocol}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-text-main">
                        {rule.portRange}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={rule.source}
                            onChange={(e) => handleUpdateSource(rule.id, e.target.value)}
                            className={`font-mono text-xs px-2.5 py-1 rounded-md border text-text-main bg-canvas transition focus:outline-none focus:ring-1 ${
                              isDangerous
                                ? 'border-danger/60 focus:ring-danger text-danger font-bold'
                                : 'border-border-subtle focus:ring-primary'
                            }`}
                          />
                          {isDangerous && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-danger/10 text-danger border border-danger/20 shrink-0">
                              WILDCARD
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-text-muted max-w-xs truncate">
                        {rule.description}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          {isDangerous && (
                            <button
                              type="button"
                              onClick={() => handleUpdateSource(rule.id, '203.0.113.50/32')}
                              title="Scope to 203.0.113.50/32"
                              className="px-2 py-0.5 text-[11px] font-semibold rounded bg-success/10 text-success hover:bg-success hover:text-white transition"
                            >
                              Scope IP
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeleteRule(rule.id)}
                            title="Delete rule"
                            className="p-1.5 rounded text-text-muted hover:text-danger hover:bg-danger/10 transition"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Outbound Rules Section (Informational / Read-Only Display) */}
      <div className="bg-surface border border-border-subtle rounded-2xl p-6 shadow-sm">
        <div className="pb-3 border-b border-border-subtle">
          <div className="flex items-center space-x-2">
            <h3 className="text-base font-bold text-text-main">
              Outbound Firewall Rules (Egress)
            </h3>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-surface-secondary text-text-muted">
              {config.outboundRules.length} Rule
            </span>
          </div>
          <p className="text-xs text-text-muted mt-1">
            Standard VPC security group configuration allowing full outbound egress for updates and external API calls.
          </p>
        </div>

        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border-subtle text-text-muted">
                <th className="py-2 px-3 font-semibold">Type</th>
                <th className="py-2 px-3 font-semibold">Protocol</th>
                <th className="py-2 px-3 font-semibold">Port Range</th>
                <th className="py-2 px-3 font-semibold">Destination</th>
                <th className="py-2 px-3 font-semibold">Description</th>
              </tr>
            </thead>
            <tbody>
              {config.outboundRules.map((r) => (
                <tr key={r.id} className="text-text-muted">
                  <td className="py-2.5 px-3">All Traffic</td>
                  <td className="py-2.5 px-3 uppercase font-mono">{r.protocol}</td>
                  <td className="py-2.5 px-3 font-mono">{r.portRange}</td>
                  <td className="py-2.5 px-3 font-mono">{r.destination || r.source || '0.0.0.0/0'}</td>
                  <td className="py-2.5 px-3">{r.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
