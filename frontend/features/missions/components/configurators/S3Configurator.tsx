'use client';

import React, { useState } from 'react';
import {
  S3MissionConfig,
  S3BlockPublicAccess,
  S3BucketAcl,
} from '../../types';
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  Unlock,
  AlertTriangle,
  FileCode,
  CheckCircle2,
  RefreshCw,
  Database,
} from 'lucide-react';

interface Props {
  config: S3MissionConfig;
  onChange: (updated: S3MissionConfig) => void;
}

export function S3Configurator({ config, onChange }: Props) {
  const [jsonError, setJsonError] = useState<string | null>(null);

  const bpa = config.blockPublicAccess;
  const allBpaEnabled =
    bpa.blockPublicAcls &&
    bpa.ignorePublicAcls &&
    bpa.blockPublicPolicy &&
    bpa.restrictPublicBuckets;

  const handleToggleBpa = (key: keyof S3BlockPublicAccess) => {
    const updatedBpa = {
      ...bpa,
      [key]: !bpa[key],
    };
    onChange({
      ...config,
      blockPublicAccess: updatedBpa,
    });
  };

  const handleToggleAllBpa = (enable: boolean) => {
    onChange({
      ...config,
      blockPublicAccess: {
        blockPublicAcls: enable,
        ignorePublicAcls: enable,
        blockPublicPolicy: enable,
        restrictPublicBuckets: enable,
      },
    });
  };

  const handleAclChange = (acl: S3BucketAcl) => {
    onChange({
      ...config,
      bucketAcl: acl,
    });
  };

  const handlePolicyChange = (text: string) => {
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
    onChange({
      ...config,
      bucketPolicy: text,
    });
  };

  const applyPresetPolicy = (type: 'broken' | 'secure' | 'empty') => {
    let policyText = '';
    if (type === 'broken') {
      policyText = JSON.stringify(
        {
          Version: '2012-10-17',
          Statement: [
            {
              Sid: 'AllowPublicInvoiceRead',
              Effect: 'Allow',
              Principal: '*',
              Action: 's3:GetObject',
              Resource: `arn:aws:s3:::${config.bucketName}/*`,
            },
          ],
        },
        null,
        2
      );
    } else if (type === 'secure') {
      policyText = JSON.stringify(
        {
          Version: '2012-10-17',
          Statement: [
            {
              Sid: 'AllowBackendServiceOnly',
              Effect: 'Allow',
              Principal: {
                AWS: 'arn:aws:iam::123456789012:role/InvoiceApplicationBackendRole',
              },
              Action: ['s3:GetObject', 's3:PutObject'],
              Resource: `arn:aws:s3:::${config.bucketName}/*`,
            },
          ],
        },
        null,
        2
      );
    } else {
      policyText = JSON.stringify(
        {
          Version: '2012-10-17',
          Statement: [],
        },
        null,
        2
      );
    }
    setJsonError(null);
    onChange({
      ...config,
      bucketPolicy: policyText,
    });
  };

  return (
    <div className="space-y-6">
      {/* S3 Resource Banner */}
      <div className="bg-surface border border-border-subtle rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-mono text-sm font-bold text-text-main">
                  {config.bucketName}
                </span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-surface-secondary text-text-muted border border-border-subtle">
                  {config.region}
                </span>
              </div>
              <span className="text-xs text-text-muted block mt-0.5">
                Amazon Simple Storage Service (S3) &bull; General Purpose Bucket
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-2 self-start sm:self-auto">
            {allBpaEnabled && config.bucketAcl === 'private' ? (
              <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-success/10 text-success border border-success/20">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Bucket Sealed (Private)</span>
              </span>
            ) : (
              <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-danger/10 text-danger border border-danger/20">
                <ShieldAlert className="h-3.5 w-3.5" />
                <span>Public Access Vectors Active</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Control Section 1: Block Public Access */}
      <div className="bg-surface border border-border-subtle rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-border-subtle gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base font-bold text-text-main">
                Block Public Access (Bucket Settings)
              </h3>
              {allBpaEnabled ? (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-success/10 text-success">
                  All 4 On
                </span>
              ) : (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-warning/10 text-warning">
                  Incomplete Protection
                </span>
              )}
            </div>
            <p className="text-xs text-text-muted mt-1 max-w-xl">
              Centralized safeguards that override bucket policies and object ACLs to prevent public internet access.
            </p>
          </div>
          <div className="flex items-center space-x-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => handleToggleAllBpa(true)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary/10 text-primary hover:bg-primary hover:text-white transition"
            >
              Enable All 4
            </button>
            <button
              type="button"
              onClick={() => handleToggleAllBpa(false)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-text-muted hover:bg-surface-secondary transition"
            >
              Disable All
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {/* Switch 1 */}
          <div
            onClick={() => handleToggleBpa('blockPublicAcls')}
            className={`p-3.5 rounded-xl border cursor-pointer transition flex items-start justify-between ${
              bpa.blockPublicAcls
                ? 'bg-primary/5 border-primary/30'
                : 'bg-surface-secondary/40 border-border-subtle hover:border-text-muted/30'
            }`}
          >
            <div className="pr-2">
              <span className="text-xs font-bold text-text-main block">
                BlockPublicAcls
              </span>
              <span className="text-[11px] text-text-muted leading-relaxed block mt-0.5">
                Blocks newly added public ACLs and puts bucket into a safe mode.
              </span>
            </div>
            <div
              className={`w-9 h-5 rounded-full p-0.5 transition-colors shrink-0 mt-0.5 ${
                bpa.blockPublicAcls ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-700'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  bpa.blockPublicAcls ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </div>
          </div>

          {/* Switch 2 */}
          <div
            onClick={() => handleToggleBpa('ignorePublicAcls')}
            className={`p-3.5 rounded-xl border cursor-pointer transition flex items-start justify-between ${
              bpa.ignorePublicAcls
                ? 'bg-primary/5 border-primary/30'
                : 'bg-surface-secondary/40 border-border-subtle hover:border-text-muted/30'
            }`}
          >
            <div className="pr-2">
              <span className="text-xs font-bold text-text-main block">
                IgnorePublicAcls
              </span>
              <span className="text-[11px] text-text-muted leading-relaxed block mt-0.5">
                Ignores all existing public ACLs on bucket and objects.
              </span>
            </div>
            <div
              className={`w-9 h-5 rounded-full p-0.5 transition-colors shrink-0 mt-0.5 ${
                bpa.ignorePublicAcls ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-700'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  bpa.ignorePublicAcls ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </div>
          </div>

          {/* Switch 3 */}
          <div
            onClick={() => handleToggleBpa('blockPublicPolicy')}
            className={`p-3.5 rounded-xl border cursor-pointer transition flex items-start justify-between ${
              bpa.blockPublicPolicy
                ? 'bg-primary/5 border-primary/30'
                : 'bg-surface-secondary/40 border-border-subtle hover:border-text-muted/30'
            }`}
          >
            <div className="pr-2">
              <span className="text-xs font-bold text-text-main block">
                BlockPublicPolicy
              </span>
              <span className="text-[11px] text-text-muted leading-relaxed block mt-0.5">
                Rejects new bucket policies that allow public access.
              </span>
            </div>
            <div
              className={`w-9 h-5 rounded-full p-0.5 transition-colors shrink-0 mt-0.5 ${
                bpa.blockPublicPolicy ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-700'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  bpa.blockPublicPolicy ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </div>
          </div>

          {/* Switch 4 */}
          <div
            onClick={() => handleToggleBpa('restrictPublicBuckets')}
            className={`p-3.5 rounded-xl border cursor-pointer transition flex items-start justify-between ${
              bpa.restrictPublicBuckets
                ? 'bg-primary/5 border-primary/30'
                : 'bg-surface-secondary/40 border-border-subtle hover:border-text-muted/30'
            }`}
          >
            <div className="pr-2">
              <span className="text-xs font-bold text-text-main block">
                RestrictPublicBuckets
              </span>
              <span className="text-[11px] text-text-muted leading-relaxed block mt-0.5">
                Restricts access to only AWS services and authorized users.
              </span>
            </div>
            <div
              className={`w-9 h-5 rounded-full p-0.5 transition-colors shrink-0 mt-0.5 ${
                bpa.restrictPublicBuckets ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-700'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  bpa.restrictPublicBuckets ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Control Section 2: Bucket Policy Editor */}
      <div className="bg-surface border border-border-subtle rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-border-subtle gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <FileCode className="h-4 w-4 text-primary" />
              <h3 className="text-base font-bold text-text-main">
                Bucket Policy Document
              </h3>
            </div>
            <p className="text-xs text-text-muted mt-1">
              JSON permissions policy applied directly to the S3 bucket resource.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => applyPresetPolicy('secure')}
              className="px-2.5 py-1 rounded-md text-xs font-semibold bg-success/10 text-success hover:bg-success hover:text-white transition"
            >
              Apply Scoped Policy
            </button>
            <button
              type="button"
              onClick={() => applyPresetPolicy('empty')}
              className="px-2.5 py-1 rounded-md text-xs font-medium bg-surface-secondary hover:bg-canvas text-text-muted border border-border-subtle transition"
            >
              Clear Policy
            </button>
            <button
              type="button"
              onClick={() => applyPresetPolicy('broken')}
              className="px-2.5 py-1 rounded-md text-xs font-medium text-danger hover:bg-danger/10 transition"
            >
              Reset to Wildcard
            </button>
          </div>
        </div>

        {jsonError && (
          <div className="mt-3 p-3 rounded-xl bg-danger/10 border border-danger/20 flex items-center space-x-2 text-danger text-xs">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>Syntax Error: {jsonError}</span>
          </div>
        )}

        <div className="mt-4">
          <textarea
            value={config.bucketPolicy}
            onChange={(e) => handlePolicyChange(e.target.value)}
            rows={10}
            spellCheck={false}
            className="w-full font-mono text-xs p-4 rounded-xl bg-canvas border border-border-subtle text-text-main focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition resize-y leading-relaxed"
            placeholder="{ ... JSON Policy Document ... }"
          />
        </div>
      </div>

      {/* Control Section 3: Bucket Access Control List (ACL) */}
      <div className="bg-surface border border-border-subtle rounded-2xl p-6 shadow-sm">
        <div className="pb-4 border-b border-border-subtle">
          <h3 className="text-base font-bold text-text-main">
            Access Control List (ACL)
          </h3>
          <p className="text-xs text-text-muted mt-1">
            Legacy XML permissions system for grant-based object and bucket ownership.
          </p>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Private */}
          <div
            onClick={() => handleAclChange('private')}
            className={`p-4 rounded-xl border cursor-pointer transition ${
              config.bucketAcl === 'private'
                ? 'bg-success/5 border-success/40 ring-1 ring-success/20'
                : 'bg-surface-secondary/40 border-border-subtle hover:border-text-muted/30'
            }`}
          >
            <div className="flex items-center space-x-2 mb-1.5">
              <Lock
                className={`h-4 w-4 ${
                  config.bucketAcl === 'private' ? 'text-success' : 'text-text-muted'
                }`}
              />
              <span className="text-xs font-bold text-text-main">
                private (Recommended)
              </span>
            </div>
            <p className="text-[11px] text-text-muted leading-relaxed">
              Only bucket owner and authorized IAM principals have access.
            </p>
          </div>

          {/* Public Read */}
          <div
            onClick={() => handleAclChange('public-read')}
            className={`p-4 rounded-xl border cursor-pointer transition ${
              config.bucketAcl === 'public-read'
                ? 'bg-danger/5 border-danger/40 ring-1 ring-danger/20'
                : 'bg-surface-secondary/40 border-border-subtle hover:border-text-muted/30'
            }`}
          >
            <div className="flex items-center space-x-2 mb-1.5">
              <Unlock
                className={`h-4 w-4 ${
                  config.bucketAcl === 'public-read' ? 'text-danger' : 'text-text-muted'
                }`}
              />
              <span className="text-xs font-bold text-danger">
                public-read (Insecure)
              </span>
            </div>
            <p className="text-[11px] text-text-muted leading-relaxed">
              Grants READ access to anonymous internet users.
            </p>
          </div>

          {/* Public Read Write */}
          <div
            onClick={() => handleAclChange('public-read-write')}
            className={`p-4 rounded-xl border cursor-pointer transition ${
              config.bucketAcl === 'public-read-write'
                ? 'bg-danger/10 border-danger ring-1 ring-danger'
                : 'bg-surface-secondary/40 border-border-subtle hover:border-text-muted/30'
            }`}
          >
            <div className="flex items-center space-x-2 mb-1.5">
              <AlertTriangle
                className={`h-4 w-4 ${
                  config.bucketAcl === 'public-read-write'
                    ? 'text-danger'
                    : 'text-text-muted'
                }`}
              />
              <span className="text-xs font-bold text-danger">
                public-read-write (Critical)
              </span>
            </div>
            <p className="text-[11px] text-text-muted leading-relaxed">
              Grants anyone permission to read, write, and delete objects.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
