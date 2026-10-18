import { Mission } from '../types';

export const s3LeakyBucketMission: Mission = {
  id: 's3-leaky-bucket',
  slug: 's3-leaky-bucket',
  title: 'The Leaky Bucket',
  subtitle: 'Remediate an insecure Amazon S3 bucket exposing confidential customer invoice PDFs',
  category: 'Storage Security',
  service: 'Amazon S3',
  difficulty: 'Beginner',
  estimatedMinutes: 15,
  tags: ['S3', 'Block Public Access', 'Bucket Policy', 'Canned ACLs', 'Storage Security'],
  shortDescription:
    'A startup accidentally configured its invoice storage so that customer data may be publicly readable. Investigate simulated S3 Block Public Access controls and secure it without breaking private access.',
  scenarioDescription:
    'A high-growth fintech startup accidentally exposed its invoice documents storage bucket (fintech-invoice-records-2026) to the public internet. During an external security audit, an unauthenticated HTTP GET request was able to download sensitive customer PDF invoices containing bank routing numbers and financial records. Your task is to investigate the bucket configuration, apply defense-in-depth access controls, and verify that all customer data is completely protected.',
  incidentBackground:
    "At 02:45 UTC, an automated notification from AWS Security Hub triggered an alert: 'S3.1 - S3 Block Public Access should be enabled'. Log analysis confirmed anonymous requests fetching object keys under /invoices/2026/Q1/. You must immediately mitigate this breach without interrupting authorized application access.",
  architectureOverview: {
    component: 'Amazon S3 Bucket',
    resourceId: 'arn:aws:s3:::fintech-invoice-records-2026',
    region: 'us-east-1',
    tags: {
      Environment: 'Production',
      Compliance: 'PCI-DSS',
      DataClassification: 'Confidential',
      Application: 'BillingService',
    },
  },
  learningObjectives: [
    {
      id: 's3-obj-1',
      title: 'Master S3 Block Public Access (BPA)',
      description:
        'Understand why all four BPA settings (BlockPublicAcls, IgnorePublicAcls, BlockPublicPolicy, RestrictPublicBuckets) act as an indispensable centralized circuit breaker.',
    },
    {
      id: 's3-obj-2',
      title: 'Analyze and Harden Bucket Policies',
      description:
        'Identify wildcard principals ("Principal": "*") and recognize how anonymous read permissions expose confidential cloud assets to the world.',
    },
    {
      id: 's3-obj-3',
      title: 'Replace Legacy Canned ACLs with Private Enclosure',
      description:
        'Recognize legacy XML/Canned Access Control Lists ("public-read") and enforce modern private ownership.',
    },
    {
      id: 's3-obj-4',
      title: 'Maintain Principle of Least Privilege',
      description:
        'Ensure corrective security measures restrict public visibility while maintaining authenticated backend application access.',
    },
  ],
  hints: [
    {
      id: 1,
      title: 'Enable S3 Block Public Access',
      text: 'Check the four switches under Block Public Access settings. Enabling all four provides an immediate account and bucket-level barrier against accidental public disclosures.',
      penaltyPoints: 5,
    },
    {
      id: 2,
      title: 'Inspect the Bucket Policy Statement',
      text: 'Examine the JSON bucket policy. Look for statements with "Effect": "Allow", "Principal": "*", and "Action": "s3:GetObject". Remove or scope this wildcard grant to an authorized IAM role.',
      penaltyPoints: 10,
    },
    {
      id: 3,
      title: 'Audit the Bucket Access Control List (ACL)',
      text: 'Check the bucket ACL setting. If it is currently set to "public-read", toggle it to "private" so only the resource owner and authenticated IAM principals can access the bucket.',
      penaltyPoints: 10,
    },
  ],
  initialState: {
    type: 's3',
    config: {
      bucketName: 'fintech-invoice-records-2026',
      region: 'us-east-1',
      blockPublicAccess: {
        blockPublicAcls: false,
        ignorePublicAcls: false,
        blockPublicPolicy: false,
        restrictPublicBuckets: false,
      },
      bucketAcl: 'public-read',
      bucketPolicy: JSON.stringify(
        {
          Version: '2012-10-17',
          Statement: [
            {
              Sid: 'AllowPublicInvoiceRead',
              Effect: 'Allow',
              Principal: '*',
              Action: 's3:GetObject',
              Resource: 'arn:aws:s3:::fintech-invoice-records-2026/*',
            },
          ],
        },
        null,
        2
      ),
      serverSideEncryption: true,
      versioning: true,
    },
  },
  recommendedState: {
    type: 's3',
    config: {
      bucketName: 'fintech-invoice-records-2026',
      region: 'us-east-1',
      blockPublicAccess: {
        blockPublicAcls: true,
        ignorePublicAcls: true,
        blockPublicPolicy: true,
        restrictPublicBuckets: true,
      },
      bucketAcl: 'private',
      bucketPolicy: JSON.stringify(
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
              Resource: 'arn:aws:s3:::fintech-invoice-records-2026/*',
            },
          ],
        },
        null,
        2
      ),
      serverSideEncryption: true,
      versioning: true,
    },
  },
  educationalDebrief: {
    rootCause:
      'The bucket was provisioned using a generic tutorial template that enabled public-read ACL and applied a wildcard Principal ("*") read policy. Without S3 Block Public Access active, the bucket was left open to anonymous internet crawling.',
    realWorldImpact:
      'Public S3 misconfigurations have caused billions of dollars in regulatory fines and brand damage across finance, healthcare, and enterprise software. Exposure of unauthenticated PII violates GDPR, HIPAA, and PCI-DSS standards.',
    preventionStrategy:
      'Turn on S3 Block Public Access at the entire AWS Organization level using Service Control Policies (SCPs). Automate continuous drift detection with AWS Config rules (s3-bucket-public-read-prohibited) and AWS Security Hub.',
    awsWellArchitectedPillar: 'Security — Data Protection & Infrastructure Protection',
  },
  investigation: {
    alert: {
      service: 'AWS Security Hub',
      alertId: 'SH-S3-001-CRITICAL',
      severity: 'critical',
      title: '[S3.1] S3 Block Public Access setting should be enabled',
      description:
        'Bucket "fintech-invoice-records-2026" was detected with all 4 Block Public Access controls disabled and an active wildcard public read policy statement.',
      timestamp: '2026-10-18T02:45:12Z',
    },
    telemetryLogs: [
      {
        id: 'log-s3-1',
        source: 'CloudTrail',
        timestamp: '2026-10-18T02:30:11Z',
        event: 'PutBucketPolicy',
        rawJsonOrText: JSON.stringify(
          {
            eventSource: 's3.amazonaws.com',
            eventName: 'PutBucketPolicy',
            userIdentity: {
              type: 'AssumedRole',
              principalId: 'AROAEXAMPLE:DeployBot',
              arn: 'arn:aws:sts::123456789012:assumed-role/DeployBot/ci',
            },
            requestParameters: {
              bucketName: 'fintech-invoice-records-2026',
              bucketPolicy: {
                Statement: [
                  {
                    Sid: 'AllowPublicInvoiceRead',
                    Effect: 'Allow',
                    Principal: '*',
                    Action: 's3:GetObject',
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
        id: 'log-s3-2',
        source: 'S3 Access Logs',
        timestamp: '2026-10-18T02:41:55Z',
        event: 'REST.GET.OBJECT',
        rawJsonOrText:
          '198.51.100.77 - - [18/Oct/2026:02:41:55 +0000] "GET /invoices/2026/Q1/inv-10492.pdf HTTP/1.1" 200 42918 "-" "curl/7.88.1" - -',
      },
      {
        id: 'log-s3-3',
        source: 'CloudTrail',
        timestamp: '2026-10-18T02:31:04Z',
        event: 'PutBucketAcl',
        rawJsonOrText: JSON.stringify(
          {
            eventSource: 's3.amazonaws.com',
            eventName: 'PutBucketAcl',
            requestParameters: {
              bucketName: 'fintech-invoice-records-2026',
              AccessControlPolicy: {
                AccessControlList: {
                  Grant: [
                    {
                      Grantee: {
                        URI: 'http://acs.amazonaws.com/groups/global/AllUsers',
                      },
                      Permission: 'READ',
                    },
                  ],
                },
              },
            },
          },
          null,
          2
        ),
      },
    ],
    evidenceNotes: [
      'Anonymous HTTP GET request succeeded without AWS SigV4 authentication headers.',
      'S3 Access Logs confirm external IP 198.51.100.77 successfully retrieved customer invoice PDF inv-10492.pdf.',
      'AWS Security Hub compliance score degraded by 15% due to critical storage misconfiguration.',
    ],
  },
};
