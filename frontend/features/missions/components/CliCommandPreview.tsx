'use client';

import React, { useState } from 'react';
import { MissionState } from '../types';
import { Terminal, Copy, Check, Code2 } from 'lucide-react';

interface Props {
  state: MissionState;
}

export function CliCommandPreview({ state }: Props) {
  const [copied, setCopied] = useState<boolean>(false);

  let commandText = '';

  if (state.type === 's3') {
    const { bucketName, blockPublicAccess, bucketAcl, bucketPolicy } = state.config;
    const cleanPolicy = bucketPolicy.replace(/\s+/g, ' ').trim();
    commandText = `# 1. Enforce S3 Block Public Access
aws s3api put-public-access-block \\
  --bucket ${bucketName} \\
  --public-access-block-configuration "BlockPublicAcls=${blockPublicAccess.blockPublicAcls},IgnorePublicAcls=${blockPublicAccess.ignorePublicAcls},BlockPublicPolicy=${blockPublicAccess.blockPublicPolicy},RestrictPublicBuckets=${blockPublicAccess.restrictPublicBuckets}"

# 2. Set Bucket Canned Access Control List
aws s3api put-bucket-acl \\
  --bucket ${bucketName} \\
  --acl ${bucketAcl}

# 3. Apply Resource Bucket Policy Document
aws s3api put-bucket-policy \\
  --bucket ${bucketName} \\
  --policy '${cleanPolicy || '{"Version":"2012-10-17","Statement":[]}'}'`;
  } else if (state.type === 'security-group') {
    const { securityGroupId, inboundRules } = state.config;
    const sshRule = inboundRules.find(
      (r) => r.portRange === '22' || (r.fromPort <= 22 && r.toPort >= 22)
    );

    const sshCommands =
      sshRule && sshRule.source !== '0.0.0.0/0'
        ? `# Restrict administrative SSH to trusted CIDR
aws ec2 authorize-security-group-ingress \\
  --group-id ${securityGroupId} \\
  --protocol tcp \\
  --port 22 \\
  --cidr ${sshRule.source}`
        : `# Remove unrestricted 0.0.0.0/0 ingress
aws ec2 revoke-security-group-ingress \\
  --group-id ${securityGroupId} \\
  --protocol tcp \\
  --port 22 \\
  --cidr 0.0.0.0/0`;

    commandText = `# 1. Audit and Synchronize Inbound Security Group Rules
${sshCommands}

# 2. Verify Port 80 & 443 Ingress for Web Availability
aws ec2 describe-security-groups \\
  --group-ids ${securityGroupId} \\
  --query "SecurityGroups[0].IpPermissions"`;
  } else if (state.type === 'iam-role') {
    const { roleName, inlinePolicies } = state.config;
    const activeDoc = inlinePolicies[0]?.policyDocument || '{}';
    const cleanDoc = activeDoc.replace(/\s+/g, ' ').trim();

    commandText = `# 1. Put Scoped Least-Privilege Inline Role Policy
aws iam put-role-policy \\
  --role-name ${roleName} \\
  --policy-name ${inlinePolicies[0]?.name || 'WorkloadPolicy'} \\
  --policy-document '${cleanDoc}'

# 2. Verify Active Attached Role Policies
aws iam get-role-policy \\
  --role-name ${roleName} \\
  --policy-name ${inlinePolicies[0]?.name || 'WorkloadPolicy'}`;
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(commandText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback if clipboard API is unavailable
    }
  };

  return (
    <div className="bg-surface border border-border-subtle rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
        <div className="flex items-center space-x-2 text-primary">
          <Terminal className="h-4 w-4" />
          <h4 className="text-xs font-bold uppercase tracking-wider">
            AWS CLI Production Command Equivalence
          </h4>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-surface-secondary hover:bg-canvas text-text-muted hover:text-text-main border border-border-subtle transition"
          title="Copy equivalent AWS CLI shell commands"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-success" />
              <span className="text-success">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              <span>Copy CLI</span>
            </>
          )}
        </button>
      </div>

      <p className="text-[11px] text-text-muted mt-2 mb-3">
        See how your simulated GUI configurations translate into real AWS CLI commands for Infrastructure-as-Code automation:
      </p>

      <pre className="p-3.5 rounded-xl bg-canvas border border-border-subtle text-text-main font-mono text-[11px] leading-relaxed overflow-x-auto whitespace-pre-wrap">
        {commandText}
      </pre>
    </div>
  );
}
