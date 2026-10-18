/**
 * CloudProof - Deterministic Mission Simulation & Verification Engine
 *
 * Evaluates simulated cloud configurations against programmatic security invariants.
 *
 * Guarantees:
 * - 100% Deterministic: Given identical state, output is identical.
 * - Zero Network I/O: Runs entirely in pure TypeScript locally in-browser.
 * - Granular Scoring: Itemized rules with clear point awards, severity, findings, and explanations.
 */

import {
  MissionState,
  S3MissionConfig,
  SecurityGroupMissionConfig,
  IAMRoleMissionConfig,
  VerificationResult,
  RuleCheckResult,
  IAMPolicyDocument,
  IAMStatement,
} from '../types';

// =========================================================================
// 1. S3 Leaky Bucket Verifier
// =========================================================================

export function verifyS3LeakyBucket(config: S3MissionConfig): VerificationResult {
  const rules: RuleCheckResult[] = [];

  // -------------------------------------------------------------
  // Rule 1: S3 Block Public Access (35 Points)
  // -------------------------------------------------------------
  const bpa = config.blockPublicAccess;
  const bpaFlags = [
    { name: 'BlockPublicAcls', val: bpa.blockPublicAcls },
    { name: 'IgnorePublicAcls', val: bpa.ignorePublicAcls },
    { name: 'BlockPublicPolicy', val: bpa.blockPublicPolicy },
    { name: 'RestrictPublicBuckets', val: bpa.restrictPublicBuckets },
  ];
  const enabledCount = bpaFlags.filter((f) => f.val).length;

  if (enabledCount === 4) {
    rules.push({
      id: 's3-bpa-check',
      name: 'S3 Block Public Access (BPA) Enabled',
      status: 'pass',
      score: 35,
      maxScore: 35,
      severity: 'critical',
      finding:
        'All 4 Block Public Access controls are active (BlockPublicAcls, IgnorePublicAcls, BlockPublicPolicy, RestrictPublicBuckets).',
      explanation:
        'S3 Block Public Access operates as a centralized account and bucket-level circuit breaker that completely blocks public ACLs and public policies, even if applied inadvertently.',
      recommendation: 'Maintain all four Block Public Access switches enabled at both bucket and account levels.',
    });
  } else if (enabledCount > 0) {
    const score = Math.round((enabledCount / 4) * 35);
    const missing = bpaFlags.filter((f) => !f.val).map((f) => f.name).join(', ');
    rules.push({
      id: 's3-bpa-check',
      name: 'S3 Block Public Access (BPA) Enabled',
      status: 'partial',
      score,
      maxScore: 35,
      severity: 'high',
      finding: `${enabledCount} of 4 Block Public Access controls are enabled. Missing: ${missing}.`,
      explanation:
        'Partial BPA leaves gaps. For instance, disabling IgnorePublicAcls allows existing public ACLs to remain active.',
      recommendation: `Enable the remaining disabled BPA switches: ${missing}.`,
    });
  } else {
    rules.push({
      id: 's3-bpa-check',
      name: 'S3 Block Public Access (BPA) Enabled',
      status: 'fail',
      score: 0,
      maxScore: 35,
      severity: 'critical',
      finding: 'All 4 S3 Block Public Access controls are disabled.',
      explanation:
        'With BPA completely off, the bucket relies solely on individual object ACLs and policy statements, leaving it vulnerable to accidental public exposure.',
      recommendation:
        'Turn on all four S3 Block Public Access controls immediately.',
    });
  }

  // -------------------------------------------------------------
  // Rule 2: Bucket Policy Restricts Anonymous Access (35 Points)
  // -------------------------------------------------------------
  let hasWildcardPublicAllow = false;
  let policyParseError = false;

  try {
    if (config.bucketPolicy && config.bucketPolicy.trim().length > 0) {
      const parsedPolicy: IAMPolicyDocument = JSON.parse(config.bucketPolicy);
      const statements: IAMStatement[] = Array.isArray(parsedPolicy.Statement)
        ? parsedPolicy.Statement
        : [];

      for (const stmt of statements) {
        if (stmt.Effect === 'Allow') {
          // Check Principal
          let isPublicPrincipal = false;
          if (stmt.Principal === '*') {
            isPublicPrincipal = true;
          } else if (
            typeof stmt.Principal === 'object' &&
            stmt.Principal !== null &&
            'AWS' in (stmt.Principal as Record<string, unknown>)
          ) {
            const awsVal = (stmt.Principal as Record<string, unknown>).AWS;
            if (awsVal === '*' || (Array.isArray(awsVal) && awsVal.includes('*'))) {
              isPublicPrincipal = true;
            }
          }

          // Check Action for read or wildcard
          let isReadAction = false;
          const actions = Array.isArray(stmt.Action) ? stmt.Action : [stmt.Action];
          for (const act of actions) {
            if (
              act === '*' ||
              act === 's3:*' ||
              act === 's3:GetObject' ||
              act === 's3:ListBucket'
            ) {
              isReadAction = true;
              break;
            }
          }

          if (isPublicPrincipal && isReadAction) {
            hasWildcardPublicAllow = true;
            break;
          }
        }
      }
    }
  } catch {
    policyParseError = true;
  }

  if (policyParseError) {
    rules.push({
      id: 's3-policy-check',
      name: 'Bucket Policy Syntax & Anonymous Access',
      status: 'fail',
      score: 0,
      maxScore: 35,
      severity: 'high',
      finding: 'The bucket policy JSON contains invalid syntax and could not be parsed.',
      explanation: 'Invalid JSON bucket policies cannot be evaluated or applied in AWS.',
      recommendation: 'Fix the JSON syntax formatting in the bucket policy editor.',
    });
  } else if (hasWildcardPublicAllow) {
    rules.push({
      id: 's3-policy-check',
      name: 'Bucket Policy Restricts Anonymous Access',
      status: 'fail',
      score: 0,
      maxScore: 35,
      severity: 'critical',
      finding:
        'Bucket policy contains an Allow statement with Principal "*" and read actions (s3:GetObject). Anonymous internet users can download objects.',
      explanation:
        'A wildcard Principal ("*") paired with Effect: Allow and s3:GetObject makes all matching objects globally accessible to anyone on the internet without authentication.',
      recommendation:
        'Remove the wildcard statement or restrict the Principal to an authorized IAM role ARN.',
    });
  } else {
    rules.push({
      id: 's3-policy-check',
      name: 'Bucket Policy Restricts Anonymous Access',
      status: 'pass',
      score: 35,
      maxScore: 35,
      severity: 'high',
      finding: 'No public wildcard read grants detected in the bucket policy.',
      explanation:
        'The bucket policy either explicitly designates an authorized IAM principal or contains no public exposure grants.',
      recommendation: 'Maintain explicit IAM role ARNs in bucket policy Principal blocks.',
    });
  }

  // -------------------------------------------------------------
  // Rule 3: Bucket ACL Enforces Private Ownership (30 Points)
  // -------------------------------------------------------------
  if (config.bucketAcl === 'private') {
    rules.push({
      id: 's3-acl-check',
      name: 'Bucket Access Control List (ACL) Enforces Private Ownership',
      status: 'pass',
      score: 30,
      maxScore: 30,
      severity: 'high',
      finding: 'Bucket ACL is set to "private". No public XML read/write grants exist.',
      explanation:
        'Private ACL ensures only the AWS account owner and authenticated principals with explicit IAM permissions can access bucket data.',
      recommendation: 'Keep the bucket ACL set to private or disable ACLs entirely (S3 Object Ownership: Bucket Owner Enforced).',
    });
  } else if (config.bucketAcl === 'public-read') {
    rules.push({
      id: 's3-acl-check',
      name: 'Bucket Access Control List (ACL) Enforces Private Ownership',
      status: 'fail',
      score: 0,
      maxScore: 30,
      severity: 'high',
      finding: 'Bucket ACL is set to "public-read", granting unauthenticated internet users read access.',
      explanation:
        'The legacy "public-read" Canned ACL grants the AllUsers predefined group READ permissions over the bucket.',
      recommendation: 'Change the bucket ACL to "private".',
    });
  } else {
    rules.push({
      id: 's3-acl-check',
      name: 'Bucket Access Control List (ACL) Enforces Private Ownership',
      status: 'fail',
      score: 0,
      maxScore: 30,
      severity: 'critical',
      finding: `Bucket ACL is set to "${config.bucketAcl}", which is dangerously permissive.`,
      explanation:
        'Public-read-write ACLs allow arbitrary users to upload files, modify contents, or delete data.',
      recommendation: 'Change the bucket ACL to "private" immediately.',
    });
  }

  const totalScore = rules.reduce((acc, r) => acc + r.score, 0);
  const overallStatus =
    totalScore === 100 ? 'passed' : totalScore > 0 ? 'partial' : 'failed';

  return {
    missionId: 's3-leaky-bucket',
    overallStatus,
    score: totalScore,
    maxScore: 100,
    rules,
    summary:
      overallStatus === 'passed'
        ? 'Congratulations! The S3 bucket is now fully secured with multi-layered defense-in-depth: Block Public Access is active, the wildcard bucket policy is removed, and the ACL is private.'
        : overallStatus === 'partial'
        ? 'Good progress. Some security layers have been applied, but residual public vectors remain open. Review the itemized findings below.'
        : 'Critical vulnerabilities remain active. The S3 bucket is still exposed to anonymous internet downloads.',
    educationalTakeaways: [
      'Defense-in-depth: Never rely on a single control. Combining S3 Block Public Access, hardened bucket policies, and private ACLs ensures no single mistake causes a data leak.',
      'S3 Block Public Access is the most powerful guardrail in AWS storage security. Always enable all 4 switches on production data buckets.',
      'Prefer IAM policies and Bucket Policies over legacy ACLs. Modern AWS best practice recommends disabling ACLs completely via Bucket Owner Enforced.',
    ],
    evaluatedAt: new Date().toISOString(),
  };
}

// =========================================================================
// 2. Security Group Door Left Open Verifier
// =========================================================================

export function verifySecurityGroupDoorOpen(
  config: SecurityGroupMissionConfig
): VerificationResult {
  const rules: RuleCheckResult[] = [];

  // Helper: check if a rule targets SSH (Port 22)
  const isSshRule = (r: { fromPort: number; toPort: number; portRange: string; protocol: string }) => {
    if (r.protocol === 'all') return true;
    if (r.fromPort <= 22 && r.toPort >= 22) return true;
    if (r.portRange === '22') return true;
    return false;
  };

  // Helper: check if source is public 0.0.0.0/0 or ::/0
  const isWildcardSource = (src: string) => {
    const s = src.trim();
    return s === '0.0.0.0/0' || s === '::/0' || s === '0.0.0.0' || s === 'any';
  };

  // -------------------------------------------------------------
  // Rule 1: Port 22 Not Exposed to 0.0.0.0/0 (45 Points)
  // -------------------------------------------------------------
  const publicSshRules = config.inboundRules.filter(
    (r) => isSshRule(r) && isWildcardSource(r.source)
  );

  if (publicSshRules.length === 0) {
    rules.push({
      id: 'sg-ssh-no-wildcard',
      name: 'Administrative SSH (Port 22) Not Exposed to 0.0.0.0/0',
      status: 'pass',
      score: 45,
      maxScore: 45,
      severity: 'critical',
      finding: 'No inbound rules expose port 22 (SSH) to the public internet (0.0.0.0/0).',
      explanation:
        'Closing port 22 to 0.0.0.0/0 prevents automated internet botnets and port scanners from discovering the SSH listener and performing brute-force authentication attacks.',
      recommendation: 'Never allow 0.0.0.0/0 on administrative ports (SSH 22, RDP 3389).',
    });
  } else {
    rules.push({
      id: 'sg-ssh-no-wildcard',
      name: 'Administrative SSH (Port 22) Not Exposed to 0.0.0.0/0',
      status: 'fail',
      score: 0,
      maxScore: 45,
      severity: 'critical',
      finding: `Found ${publicSshRules.length} inbound rule(s) exposing Port 22 (SSH) to 0.0.0.0/0.`,
      explanation:
        'Opening port 22 to 0.0.0.0/0 exposes the Linux shell to all 4.3 billion IPv4 addresses. SSH services under constant internet scanning are highly vulnerable to zero-days and brute-force credential stuffing.',
      recommendation:
        'Restrict or delete the inbound rule allowing 0.0.0.0/0 on port 22.',
    });
  }

  // -------------------------------------------------------------
  // Rule 2: Administrative Access Scoped or Managed (30 Points)
  // -------------------------------------------------------------
  const sshRules = config.inboundRules.filter((r) => isSshRule(r));

  if (sshRules.length === 0) {
    // If no SSH rules exist at all, that's a valid modern secure pattern (e.g. AWS SSM Session Manager)
    rules.push({
      id: 'sg-ssh-restricted',
      name: 'Administrative Access Scoped to Trusted Range or Session Manager',
      status: 'pass',
      score: 30,
      maxScore: 30,
      severity: 'high',
      finding:
        'Port 22 ingress is completely absent from the security group. Server administration relies on SSM Session Manager without open ports.',
      explanation:
        'Using AWS Systems Manager Session Manager eliminates the need for open inbound SSH ports entirely, providing IAM-authenticated console access.',
      recommendation: 'Continue using SSM Session Manager for secure, port-less server management.',
    });
  } else {
    // Check if all SSH rules are scoped to non-wildcard trusted ranges
    const nonWildcardRules = sshRules.filter((r) => !isWildcardSource(r.source));
    const allScoped = nonWildcardRules.length === sshRules.length;

    if (allScoped) {
      const sources = sshRules.map((r) => r.source).join(', ');
      rules.push({
        id: 'sg-ssh-restricted',
        name: 'Administrative Access Scoped to Trusted Range',
        status: 'pass',
        score: 30,
        maxScore: 30,
        severity: 'high',
        finding: `Inbound SSH access is restricted to authorized administrative CIDRs: [${sources}].`,
        explanation:
          'Scoping SSH ingress to a specific bastion IP (/32) or corporate network (/16) restricts the attack surface strictly to authorized administrators.',
        recommendation: 'Ensure admin source IPs are managed via prefix lists or VPN gateways.',
      });
    } else {
      rules.push({
        id: 'sg-ssh-restricted',
        name: 'Administrative Access Scoped to Trusted Range',
        status: 'fail',
        score: 0,
        maxScore: 30,
        severity: 'high',
        finding: 'SSH access is not restricted to trusted CIDR blocks.',
        explanation:
          'Administrative ingress must be scoped to specific authorized IP ranges such as 203.0.113.50/32 or corporate intranet 10.0.0.0/16.',
        recommendation:
          'Set the source CIDR on port 22 to 203.0.113.50/32 or remove the rule.',
      });
    }
  }

  // -------------------------------------------------------------
  // Rule 3: Public Application Web Ingress Preserved (25 Points)
  // -------------------------------------------------------------
  const hasPort80 = config.inboundRules.some(
    (r) =>
      (r.portRange === '80' || (r.fromPort <= 80 && r.toPort >= 80)) &&
      isWildcardSource(r.source)
  );
  const hasPort443 = config.inboundRules.some(
    (r) =>
      (r.portRange === '443' || (r.fromPort <= 443 && r.toPort >= 443)) &&
      isWildcardSource(r.source)
  );

  if (hasPort80 && hasPort443) {
    rules.push({
      id: 'sg-web-ports-preserved',
      name: 'Public Web Ingress (HTTP 80 & HTTPS 443) Preserved',
      status: 'pass',
      score: 25,
      maxScore: 25,
      severity: 'medium',
      finding: 'Both HTTP (80) and HTTPS (443) inbound rules are active and available to 0.0.0.0/0.',
      explanation:
        'Public-facing web applications require ingress on ports 80 and 443 so internet users can access the website without firewall connection timeouts.',
      recommendation: 'Keep HTTP and HTTPS open to 0.0.0.0/0 on public web-tier security groups.',
    });
  } else if (hasPort80 || hasPort443) {
    const present = hasPort80 ? 'HTTP 80' : 'HTTPS 443';
    const missing = hasPort80 ? 'HTTPS 443' : 'HTTP 80';
    rules.push({
      id: 'sg-web-ports-preserved',
      name: 'Public Web Ingress (HTTP 80 & HTTPS 443) Preserved',
      status: 'partial',
      score: 12,
      maxScore: 25,
      severity: 'medium',
      finding: `Only ${present} is open to the public; ${missing} is missing or closed.`,
      explanation:
        'Modern web applications should support both HTTP (for initial redirect) and HTTPS (for secure transport).',
      recommendation: `Add or restore the inbound rule for ${missing} with source 0.0.0.0/0.`,
    });
  } else {
    rules.push({
      id: 'sg-web-ports-preserved',
      name: 'Public Web Ingress (HTTP 80 & HTTPS 443) Preserved',
      status: 'fail',
      score: 0,
      maxScore: 25,
      severity: 'medium',
      finding: 'Both HTTP (80) and HTTPS (443) inbound rules have been removed or closed.',
      explanation:
        'In fixing the SSH issue, the web application traffic was accidentally severed. Legitimate customers cannot connect to the server.',
      recommendation:
        'Restore inbound rules for HTTP (80) and HTTPS (443) from 0.0.0.0/0.',
    });
  }

  const totalScore = rules.reduce((acc, r) => acc + r.score, 0);
  const overallStatus =
    totalScore === 100 ? 'passed' : totalScore > 0 ? 'partial' : 'failed';

  return {
    missionId: 'sg-door-open',
    overallStatus,
    score: totalScore,
    maxScore: 100,
    rules,
    summary:
      overallStatus === 'passed'
        ? 'Outstanding work! Administrative SSH (port 22) has been secured away from the public internet without taking down legitimate public web traffic on ports 80 and 443.'
        : overallStatus === 'partial'
        ? 'Progress made. However, either SSH remains exposed, or public web traffic (80/443) was accidentally compromised. Check the breakdown below.'
        : 'Critical exposure remains. Port 22 SSH is still accessible from the global IPv4 internet (0.0.0.0/0).',
    educationalTakeaways: [
      'CIDR notation: 0.0.0.0/0 means every address on the internet. A /32 mask limits access to a single specific IP address.',
      'Never expose management protocols (SSH 22, RDP 3389) to 0.0.0.0/0. If remote access is needed, use a bastion host with a strict CIDR or AWS Systems Manager Session Manager.',
      'Remember business continuity: Fixing a security flaw must not break legitimate application availability.',
    ],
    evaluatedAt: new Date().toISOString(),
  };
}

// =========================================================================
// 3. IAM Too Much Power Verifier
// =========================================================================

export function verifyIAMTooMuchPower(
  config: IAMRoleMissionConfig
): VerificationResult {
  const rules: RuleCheckResult[] = [];

  let hasWildcardAction = false;
  let hasWildcardResource = false;
  let hasScopedS3 = false;
  let hasScopedDynamo = false;
  let parseErrors = false;

  const targetBucketArn = 'company-order-raw-events';
  const targetTableArn = 'BillingLedger';

  for (const policy of config.inlinePolicies) {
    try {
      if (!policy.policyDocument || policy.policyDocument.trim().length === 0) {
        continue;
      }
      const doc: IAMPolicyDocument = JSON.parse(policy.policyDocument);
      const statements: IAMStatement[] = Array.isArray(doc.Statement)
        ? doc.Statement
        : [];

      for (const stmt of statements) {
        if (stmt.Effect === 'Allow') {
          // Check Action for wildcard
          const actions = Array.isArray(stmt.Action) ? stmt.Action : [stmt.Action];
          for (const act of actions) {
            if (act === '*' || act === '*:*') {
              hasWildcardAction = true;
            }
          }

          // Check Resource for wildcard
          const resources = Array.isArray(stmt.Resource)
            ? stmt.Resource
            : [stmt.Resource];
          for (const res of resources) {
            if (res === '*') {
              hasWildcardResource = true;
            }
          }

          // Check for scoped S3 read
          const hasS3Action = actions.some(
            (a) =>
              a === 's3:GetObject' ||
              a === 's3:ListBucket' ||
              a === 's3:Get*'
          );
          const hasS3Resource = resources.some(
            (r) => r.includes(targetBucketArn) && r !== '*'
          );
          if (hasS3Action && hasS3Resource && !actions.includes('*')) {
            hasScopedS3 = true;
          }

          // Check for scoped DynamoDB write
          const hasDynamoAction = actions.some(
            (a) =>
              a === 'dynamodb:PutItem' ||
              a === 'dynamodb:UpdateItem' ||
              a === 'dynamodb:GetItem'
          );
          const hasDynamoResource = resources.some(
            (r) => r.includes(targetTableArn) && r !== '*'
          );
          if (hasDynamoAction && hasDynamoResource && !actions.includes('*')) {
            hasScopedDynamo = true;
          }
        }
      }
    } catch {
      parseErrors = true;
    }
  }

  // -------------------------------------------------------------
  // Rule 1: Wildcard Administrator Action Eliminated (40 Points)
  // -------------------------------------------------------------
  if (parseErrors) {
    rules.push({
      id: 'iam-no-admin-action',
      name: 'IAM Policy Syntax & Admin Action Audit',
      status: 'fail',
      score: 0,
      maxScore: 40,
      severity: 'high',
      finding: 'An inline policy document contains malformed JSON syntax.',
      explanation: 'Malformed IAM policy JSON cannot be validated or deployed in AWS.',
      recommendation: 'Correct the JSON formatting in the inline policy editor.',
    });
  } else if (hasWildcardAction) {
    rules.push({
      id: 'iam-no-admin-action',
      name: 'Eliminate Wildcard Administrator Action ("Action": "*")',
      status: 'fail',
      score: 0,
      maxScore: 40,
      severity: 'critical',
      finding:
        'Policy grants "Action": "*", allowing execution of any API call across all AWS services in the account.',
      explanation:
        'Wildcard Action grants AdministratorAccess. If the Lambda workload suffers an SSRF or dependency injection vulnerability, an attacker can delete databases, create rogue IAM users, or launch cryptominers.',
      recommendation:
        'Remove "Action": "*" and specify only the granular actions needed (s3:GetObject, dynamodb:PutItem).',
    });
  } else {
    rules.push({
      id: 'iam-no-admin-action',
      name: 'Eliminate Wildcard Administrator Action ("Action": "*")',
      status: 'pass',
      score: 40,
      maxScore: 40,
      severity: 'critical',
      finding: 'No wildcard Action grants ("*") detected in inline role policies.',
      explanation:
        'Removing wildcard actions eliminates broad administrator access and confines the role to explicitly enumerated operations.',
      recommendation: 'Always specify discrete API actions in IAM statements.',
    });
  }

  // -------------------------------------------------------------
  // Rule 2: Wildcard Resource Grant Eliminated (30 Points)
  // -------------------------------------------------------------
  if (hasWildcardResource) {
    rules.push({
      id: 'iam-no-wildcard-resource',
      name: 'Eliminate Wildcard Resource Grant ("Resource": "*")',
      status: 'fail',
      score: 0,
      maxScore: 30,
      severity: 'high',
      finding:
        'Policy permits actions against "Resource": "*", granting access to every resource in the account.',
      explanation:
        'Using "Resource": "*" allows the role to touch any S3 bucket or DynamoDB table across the organization, rather than just the specific data required for its function.',
      recommendation:
        'Replace "Resource": "*" with specific ARNs for the orders bucket and BillingLedger table.',
    });
  } else if (!hasWildcardAction && (hasScopedS3 || hasScopedDynamo)) {
    rules.push({
      id: 'iam-no-wildcard-resource',
      name: 'Eliminate Wildcard Resource Grant ("Resource": "*")',
      status: 'pass',
      score: 30,
      maxScore: 30,
      severity: 'high',
      finding: 'All policy statements target explicit resource ARNs rather than the global wildcard ("*").',
      explanation:
        'Restricting resource ARNs enforces boundary containment, ensuring the role cannot touch sensitive resources belonging to other microservices.',
      recommendation: 'Maintain specific ARNs on all policy statements.',
    });
  } else {
    // If no resources or still wildcard
    rules.push({
      id: 'iam-no-wildcard-resource',
      name: 'Eliminate Wildcard Resource Grant ("Resource": "*")',
      status: 'fail',
      score: 0,
      maxScore: 30,
      severity: 'medium',
      finding: 'No properly scoped resource ARNs were found.',
      explanation:
        'The policy should explicitly target the company-order-raw-events bucket ARN and BillingLedger table ARN.',
      recommendation:
        'Add specific resource ARNs: arn:aws:s3:::company-order-raw-events/* and arn:aws:dynamodb:us-east-1:123456789012:table/BillingLedger.',
    });
  }

  // -------------------------------------------------------------
  // Rule 3: Least Privilege Scoped to Workload (30 Points)
  // -------------------------------------------------------------
  if (hasScopedS3 && hasScopedDynamo) {
    rules.push({
      id: 'iam-least-privilege-scoped',
      name: 'Least-Privilege Scoped to Workload Requirements',
      status: 'pass',
      score: 30,
      maxScore: 30,
      severity: 'medium',
      finding:
        'Role correctly possesses scoped read permissions on the orders S3 bucket and scoped write permissions on the BillingLedger DynamoDB table.',
      explanation:
        'The policy exemplifies the Principle of Least Privilege: only the exact necessary permissions are granted to fulfill the business workload.',
      recommendation: 'Regularly audit role usage with IAM Access Analyzer to prune unused actions.',
    });
  } else if (hasScopedS3 || hasScopedDynamo) {
    const configured = hasScopedS3 ? 'S3 Read' : 'DynamoDB Write';
    const missing = hasScopedS3 ? 'DynamoDB Write' : 'S3 Read';
    rules.push({
      id: 'iam-least-privilege-scoped',
      name: 'Least-Privilege Scoped to Workload Requirements',
      status: 'partial',
      score: 15,
      maxScore: 30,
      severity: 'medium',
      finding: `${configured} permissions are configured, but ${missing} permissions are missing or improperly scoped.`,
      explanation:
        'The billing sync Lambda requires both reading order events from S3 and writing transaction entries to DynamoDB.',
      recommendation: `Add the missing scoped permissions for ${missing}.`,
    });
  } else {
    rules.push({
      id: 'iam-least-privilege-scoped',
      name: 'Least-Privilege Scoped to Workload Requirements',
      status: 'fail',
      score: 0,
      maxScore: 30,
      severity: 'high',
      finding: 'Role lacks required scoped operational permissions for S3 and DynamoDB.',
      explanation:
        'The application workload cannot perform its designated task without scoped permissions for s3:GetObject and dynamodb:PutItem.',
      recommendation:
        'Implement scoped statements for S3 bucket read and DynamoDB table write operations.',
    });
  }

  const totalScore = rules.reduce((acc, r) => acc + r.score, 0);
  const overallStatus =
    totalScore === 100 ? 'passed' : totalScore > 0 ? 'partial' : 'failed';

  return {
    missionId: 'iam-too-much-power',
    overallStatus,
    score: totalScore,
    maxScore: 100,
    rules,
    summary:
      overallStatus === 'passed'
        ? 'Excellent work! The dangerous wildcard AdministratorAccess policy has been completely replaced with a clean, least-privilege policy tailored to the billing worker service.'
        : overallStatus === 'partial'
        ? 'Partial progress. Wildcards may have been reduced, but either resource ARNs or specific required service actions are incomplete.'
        : 'Critical vulnerability remains. The IAM role still retains dangerous wildcard permissions.',
    educationalTakeaways: [
      'The Principle of Least Privilege: Never grant more permissions than a workload actually needs to perform its job.',
      'Wildcards ("*") in IAM are a massive security hazard. A single compromised worker can compromise the entire AWS account.',
      'Always separate distinct service actions and resource targets into dedicated statement blocks with descriptive Sids.',
    ],
    evaluatedAt: new Date().toISOString(),
  };
}

// =========================================================================
// 4. Unified Verifier Dispatcher
// =========================================================================

export function verifyMissionState(
  missionId: string,
  state: MissionState
): VerificationResult {
  switch (missionId) {
    case 's3-leaky-bucket':
      if (state.type !== 's3') {
        throw new Error(`Invalid state type '${state.type}' for mission '${missionId}'`);
      }
      return verifyS3LeakyBucket(state.config);

    case 'sg-door-open':
      if (state.type !== 'security-group') {
        throw new Error(
          `Invalid state type '${state.type}' for mission '${missionId}'`
        );
      }
      return verifySecurityGroupDoorOpen(state.config);

    case 'iam-too-much-power':
      if (state.type !== 'iam-role') {
        throw new Error(
          `Invalid state type '${state.type}' for mission '${missionId}'`
        );
      }
      return verifyIAMTooMuchPower(state.config);

    default:
      throw new Error(`Unknown mission ID '${missionId}'`);
  }
}
