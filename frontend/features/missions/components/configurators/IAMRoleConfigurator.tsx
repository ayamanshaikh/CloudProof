'use client';

import React, { useState } from 'react';
import {
  IAMRoleMissionConfig,
  IAMPolicyDocument,
  IAMStatement,
} from '../../types';
import {
  Key,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  FileCode,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

interface Props {
  config: IAMRoleMissionConfig;
  onChange: (updated: IAMRoleMissionConfig) => void;
}

export function IAMRoleConfigurator({ config, onChange }: Props) {
  const [jsonError, setJsonError] = useState<string | null>(null);

  const activePolicy = config.inlinePolicies[0] || {
    id: 'policy-default',
    name: 'CustomInlinePolicy',
    policyDocument: '{\n  "Version": "2012-10-17",\n  "Statement": []\n}',
  };

  // Quick audit of active policy
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
        if (acts.includes('*') || acts.includes('*:*')) {
          hasWildcardAction = true;
        }
        const res = Array.isArray(stmt.Resource) ? stmt.Resource : [stmt.Resource];
        if (res.includes('*')) {
          hasWildcardResource = true;
        }
      }
    }
  } catch {
    // handled by jsonError state
  }

  const handlePolicyDocChange = (text: string) => {
    try {
      if (text.trim().length > 0) {
        JSON.parse(text);
      }
      setJsonError(null);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setJsonError(err.message);
      } else {
        setJsonError('Invalid JSON format');
      }
    }

    const updatedPolicies = config.inlinePolicies.map((p, idx) => {
      if (idx === 0) {
        return { ...p, policyDocument: text };
      }
      return p;
    });

    onChange({
      ...config,
      inlinePolicies: updatedPolicies,
    });
  };

  const handleApplyPreset = (type: 'least-privilege' | 'wildcard' | 'format') => {
    let newDoc = '';
    if (type === 'least-privilege') {
      newDoc = JSON.stringify(
        {
          Version: '2012-10-17',
          Statement: [
            {
              Sid: 'AllowReadOrderRawEvents',
              Effect: 'Allow',
              Action: ['s3:GetObject', 's3:ListBucket'],
              Resource: [
                'arn:aws:s3:::company-order-raw-events',
                'arn:aws:s3:::company-order-raw-events/*',
              ],
            },
            {
              Sid: 'AllowWriteBillingLedger',
              Effect: 'Allow',
              Action: [
                'dynamodb:PutItem',
                'dynamodb:UpdateItem',
                'dynamodb:GetItem',
              ],
              Resource:
                'arn:aws:dynamodb:us-east-1:123456789012:table/BillingLedger',
            },
          ],
        },
        null,
        2
      );
    } else if (type === 'wildcard') {
      newDoc = JSON.stringify(
        {
          Version: '2012-10-17',
          Statement: [
            {
              Sid: 'AllowAllActionsEverywhere',
              Effect: 'Allow',
              Action: '*',
              Resource: '*',
            },
          ],
        },
        null,
        2
      );
    } else if (type === 'format') {
      try {
        const parsed = JSON.parse(activePolicy.policyDocument);
        newDoc = JSON.stringify(parsed, null, 2);
      } catch {
        return;
      }
    }

    setJsonError(null);
    const updatedPolicies = config.inlinePolicies.map((p, idx) => {
      if (idx === 0) {
        return { ...p, policyDocument: newDoc };
      }
      return p;
    });

    onChange({
      ...config,
      inlinePolicies: updatedPolicies,
    });
  };

  return (
    <div className="space-y-6">
      {/* Role Summary Banner */}
      <div className="bg-surface border border-border-subtle rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <Key className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-mono text-sm font-bold text-text-main">
                  {config.roleName}
                </span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-surface-secondary text-text-muted border border-border-subtle">
                  AWS IAM Role
                </span>
              </div>
              <span className="text-xs text-text-muted block mt-0.5 font-mono">
                {config.roleArn}
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-2 self-start sm:self-auto">
            {!hasWildcardAction && !hasWildcardResource ? (
              <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-success/10 text-success border border-success/20">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Least Privilege Enforced</span>
              </span>
            ) : (
              <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-danger/10 text-danger border border-danger/20">
                <ShieldAlert className="h-3.5 w-3.5" />
                <span>Wildcard Permissions Active</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Trust Relationship Overview */}
      <div className="bg-surface border border-border-subtle rounded-2xl p-6 shadow-sm">
        <div className="pb-3 border-b border-border-subtle">
          <h3 className="text-base font-bold text-text-main">
            Trust Relationships (AssumeRole)
          </h3>
          <p className="text-xs text-text-muted mt-1">
            Defines which AWS service principals or entities are authorized to assume this IAM role.
          </p>
        </div>
        <div className="mt-3 flex items-center space-x-2 text-xs">
          <span className="text-text-muted">Trusted Entity:</span>
          <code className="font-mono px-2 py-0.5 rounded bg-surface-secondary text-primary font-semibold border border-border-subtle">
            lambda.amazonaws.com
          </code>
          <span className="text-text-muted">&bull; Action:</span>
          <code className="font-mono px-2 py-0.5 rounded bg-surface-secondary text-text-main border border-border-subtle">
            sts:AssumeRole
          </code>
        </div>
      </div>

      {/* Inline Policy Editor */}
      <div className="bg-surface border border-border-subtle rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-border-subtle gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <FileCode className="h-4 w-4 text-primary" />
              <h3 className="text-base font-bold text-text-main">
                Inline Policy: <span className="font-mono text-primary">{activePolicy.name}</span>
              </h3>
            </div>
            <p className="text-xs text-text-muted mt-1">
              JSON permissions document dictating allowed actions and target resources.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handleApplyPreset('least-privilege')}
              className="inline-flex items-center space-x-1 px-3 py-1 rounded-md text-xs font-semibold bg-success/10 text-success hover:bg-success hover:text-white transition"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Apply Least-Privilege Scoped Policy</span>
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset('format')}
              className="px-2.5 py-1 rounded-md text-xs font-medium text-text-muted bg-surface-secondary hover:bg-canvas border border-border-subtle transition"
            >
              Format JSON
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset('wildcard')}
              className="px-2.5 py-1 rounded-md text-xs font-medium text-danger hover:bg-danger/10 transition"
            >
              Reset to Wildcard Admin
            </button>
          </div>
        </div>

        {/* Real-time Risk Badges */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {hasWildcardAction && (
            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-danger/10 text-danger border border-danger/20">
              <AlertTriangle className="h-3 w-3" />
              <span>Wildcard Action ('*') Detected</span>
            </span>
          )}
          {hasWildcardResource && (
            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-danger/10 text-danger border border-danger/20">
              <AlertTriangle className="h-3 w-3" />
              <span>Wildcard Resource ('*') Detected</span>
            </span>
          )}
          {!hasWildcardAction && !hasWildcardResource && !jsonError && (
            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-success/10 text-success border border-success/20">
              <CheckCircle2 className="h-3 w-3" />
              <span>No Administrative Wildcards Detected</span>
            </span>
          )}
        </div>

        {jsonError && (
          <div className="mt-3 p-3 rounded-xl bg-danger/10 border border-danger/20 flex items-center space-x-2 text-danger text-xs">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>Syntax Error: {jsonError}</span>
          </div>
        )}

        <div className="mt-4">
          <textarea
            value={activePolicy.policyDocument}
            onChange={(e) => handlePolicyDocChange(e.target.value)}
            rows={14}
            spellCheck={false}
            className="w-full font-mono text-xs p-4 rounded-xl bg-canvas border border-border-subtle text-text-main focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition resize-y leading-relaxed"
            placeholder="{ ... JSON IAM Policy ... }"
          />
        </div>
      </div>
    </div>
  );
}
