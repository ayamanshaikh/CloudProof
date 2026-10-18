import { Mission } from '../types';

export const iamTooMuchPowerMission: Mission = {
  id: 'iam-too-much-power',
  slug: 'iam-too-much-power',
  title: 'Too Much Power',
  subtitle: 'Remediate an overly permissive IAM execution role with AdministratorAccess wildcard * permissions',
  category: 'Identity & Access',
  service: 'AWS IAM',
  difficulty: 'Intermediate',
  estimatedMinutes: 25,
  tags: ['IAM', 'Least Privilege', 'Policy Syntax', 'Wildcard Permissions', 'Identity & Access'],
  shortDescription:
    'An application execution role carries overly broad administrative permissions. Detect the wildcard Action policy and replace it with a least-privilege configuration tailored to the workload.',
  scenarioDescription:
    "An automated nightly billing-sync microservice runs on AWS Lambda using the execution role BillingWorkerSyncRole. To prevent permissions errors during rapid initial development, an engineer attached an inline policy with Effect: Allow, Action: *, Resource: * ('FullAdminBypass'). The Lambda only actually needs to read raw purchase events from an S3 bucket (arn:aws:s3:::company-order-raw-events/*) and record transactions in DynamoDB (arn:aws:dynamodb:us-east-1:123456789012:table/BillingLedger). Your task is to inspect the attached policies, remove the wildcard AdministratorAccess grant, and implement a least-privilege policy containing only the exact actions and resources required.",
  incidentBackground:
    'AWS IAM Access Analyzer flagged BillingWorkerSyncRole as having excessive administrator capabilities. A compromised software dependency in the Lambda runtime could execute arbitrary AWS API calls across the entire AWS account.',
  architectureOverview: {
    component: 'AWS IAM Role',
    resourceId: 'arn:aws:iam::123456789012:role/BillingWorkerSyncRole',
    region: 'us-east-1',
    tags: {
      Service: 'BillingLambda',
      Tier: 'Worker',
      Compliance: 'LeastPrivilegeAudit',
      Environment: 'Production',
    },
  },
  learningObjectives: [
    {
      id: 'iam-obj-1',
      title: 'Analyze IAM Policy Grammar & Semantics',
      description:
        'Understand the core components of IAM policies: Version, Statement, Effect, Action, Resource, and Condition.',
    },
    {
      id: 'iam-obj-2',
      title: 'Identify Wildcard Blast Radius',
      description:
        'Recognize how "Action": "*" and "Resource": "*" grant boundless privilege across all services in the AWS account.',
    },
    {
      id: 'iam-obj-3',
      title: 'Enforce Principle of Least Privilege',
      description:
        'Scope actions to the exact operations required (s3:GetObject, dynamodb:PutItem) and restrict targets to specific resource ARNs.',
    },
    {
      id: 'iam-obj-4',
      title: 'Structure Safe, Maintainable Policies',
      description:
        'Separate distinct service permissions into discrete statements with descriptive Statement IDs (Sids) for clear auditing.',
    },
  ],
  hints: [
    {
      id: 1,
      title: 'Check the Inline Policy Statement',
      text: 'Examine the current policy document. Notice that "Action": "*" and "Resource": "*" grants unrestricted administrative power across all AWS services.',
      penaltyPoints: 5,
    },
    {
      id: 2,
      title: 'Scope Actions to Required Services',
      text: 'Replace "Action": "*" with explicit read actions for S3 (e.g., "s3:GetObject", "s3:ListBucket") and explicit write actions for DynamoDB (e.g., "dynamodb:PutItem", "dynamodb:UpdateItem", "dynamodb:GetItem").',
      penaltyPoints: 10,
    },
    {
      id: 3,
      title: 'Scope Resources to Specific ARNs',
      text: 'Replace "Resource": "*" with the exact bucket ARN ("arn:aws:s3:::company-order-raw-events/*") and the specific DynamoDB table ARN ("arn:aws:dynamodb:us-east-1:123456789012:table/BillingLedger").',
      penaltyPoints: 10,
    },
  ],
  initialState: {
    type: 'iam-role',
    config: {
      roleName: 'BillingWorkerSyncRole',
      roleArn: 'arn:aws:iam::123456789012:role/BillingWorkerSyncRole',
      assumeRolePolicyDocument: JSON.stringify(
        {
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: 'lambda.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            },
          ],
        },
        null,
        2
      ),
      inlinePolicies: [
        {
          id: 'policy-admin-bypass',
          name: 'FullAdminBypass',
          policyDocument: JSON.stringify(
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
          ),
        },
      ],
    },
  },
  recommendedState: {
    type: 'iam-role',
    config: {
      roleName: 'BillingWorkerSyncRole',
      roleArn: 'arn:aws:iam::123456789012:role/BillingWorkerSyncRole',
      assumeRolePolicyDocument: JSON.stringify(
        {
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: 'lambda.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            },
          ],
        },
        null,
        2
      ),
      inlinePolicies: [
        {
          id: 'policy-least-privilege',
          name: 'BillingSyncLeastPrivilege',
          policyDocument: JSON.stringify(
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
          ),
        },
      ],
    },
  },
  educationalDebrief: {
    rootCause:
      'Engineers frequently deploy "Action: *" during fast prototyping to avoid policy troubleshooting, intending to tighten permissions later. Without automated guardrails, these dangerous administrative roles ship straight to production.',
    realWorldImpact:
      'Over-privileged IAM roles are a primary vehicle for cloud account takeovers, cryptojacking, and catastrophic ransomware. If any application dependency contains an SSRF or remote code execution bug, an attacker inherits full control of the entire AWS account.',
    preventionStrategy:
      'Enforce IAM Access Analyzer, establish automated CI/CD policy linters, and utilize AWS Service Control Policies (SCPs) and Permission Boundaries to forbid wildcard grants on application execution roles.',
    awsWellArchitectedPillar: 'Security — Identity and Access Management',
  },
  investigation: {
    alert: {
      service: 'AWS IAM Access Analyzer',
      alertId: 'IAA-ROLE-ADMIN-042',
      severity: 'critical',
      title: 'ExternalAccess.Role.WildcardAdministrator',
      description:
        'Role "BillingWorkerSyncRole" grants unrestricted administrative capabilities (Action: *, Resource: *) to execution principal lambda.amazonaws.com.',
      timestamp: '2026-10-18T01:22:45Z',
    },
    telemetryLogs: [
      {
        id: 'log-iam-1',
        source: 'CloudTrail',
        timestamp: '2026-10-18T01:15:30Z',
        event: 'PutRolePolicy',
        rawJsonOrText: JSON.stringify(
          {
            eventSource: 'iam.amazonaws.com',
            eventName: 'PutRolePolicy',
            userIdentity: {
              type: 'IAMUser',
              userName: 'intern-dev-quickstart',
            },
            requestParameters: {
              roleName: 'BillingWorkerSyncRole',
              policyName: 'FullAdminBypass',
              policyDocument: {
                Version: '2012-10-17',
                Statement: [
                  {
                    Effect: 'Allow',
                    Action: '*',
                    Resource: '*',
                  },
                ],
              },
            },
          },
          null,
          2
        ),
      },
      {
        id: 'log-iam-2',
        source: 'Lambda Logs',
        timestamp: '2026-10-18T01:20:00Z',
        event: 'CloudWatch_Execution_Trace',
        rawJsonOrText:
          '2026-10-18T01:20:00.112Z [INFO] Processing batch 8492. Executed AWS API: s3:GetObject(s3://company-order-raw-events/orders-20261018.csv)\n2026-10-18T01:20:00.450Z [INFO] Parsed 230 transactions. Executed AWS API: dynamodb:PutItem(table: BillingLedger, items: 230)\n2026-10-18T01:20:00.890Z [INFO] Batch sync complete in 778ms. 0 other AWS APIs called.',
      },
    ],
    evidenceNotes: [
      'CloudTrail logs show developer attached FullAdminBypass policy during sprint crunch.',
      'Lambda runtime profiling proves the worker only requires s3:GetObject and dynamodb:PutItem.',
      'Wildcard Resource: * grants dangerous potential blast radius over all company S3 buckets and databases.',
    ],
  },
};
