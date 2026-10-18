import { Mission } from '../types';

export const sgDoorOpenMission: Mission = {
  id: 'sg-door-open',
  slug: 'sg-door-open',
  title: 'Door Left Open',
  subtitle: 'Remediate an insecure VPC Security Group exposing administrative SSH (Port 22) to 0.0.0.0/0',
  category: 'Network Security',
  service: 'VPC Security Groups',
  difficulty: 'Intermediate',
  estimatedMinutes: 20,
  tags: ['VPC', 'Security Group', 'SSH', 'CIDR Notation', 'Network Security'],
  shortDescription:
    'A development environment inadvertently exposes administrative SSH (port 22) to the entire IPv4 internet (0.0.0.0/0). Investigate the inbound firewall rules and restrict access to authorized CIDR blocks.',
  scenarioDescription:
    "During an urgent late-night database outage, an on-call DevOps engineer created an inbound rule allowing port 22 (SSH) from 0.0.0.0/0 on security group sg-0e42a991f8c47b19 ('app-prod-bastion-sg') so they could troubleshoot from a hotel Wi-Fi connection. The incident was resolved, but the temporary firewall bypass was never removed. The bastion host is now receiving thousands of automated SSH brute-force attempts per minute. Your task is to inspect the inbound firewall rules, restrict administrative access to the authorized corporate bastion CIDR (203.0.113.50/32), and ensure that public web traffic (ports 80 & 443) remains undisturbed.",
  incidentBackground:
    "CloudTrail event 'AuthorizeSecurityGroupIngress' was triggered at 03:12 UTC without an approved change ticket. VPC Flow Logs indicate an immediate 400x surge in TCP SYN packets targeting port 22 from automated scanners across the internet.",
  architectureOverview: {
    component: 'EC2 VPC Security Group',
    resourceId: 'sg-0e42a991f8c47b19',
    region: 'us-east-1',
    tags: {
      Name: 'app-prod-bastion-sg',
      Tier: 'Bastion/DMZ',
      Environment: 'Production',
      Application: 'EdgeProxy',
    },
  },
  learningObjectives: [
    {
      id: 'sg-obj-1',
      title: 'Understand Stateful Security Group Rules',
      description:
        'Learn how Security Groups operate at the elastic network interface (ENI) level, automatically tracking return connections while filtering incoming traffic.',
    },
    {
      id: 'sg-obj-2',
      title: 'Master CIDR Notation & Scope',
      description:
        'Understand that 0.0.0.0/0 encompasses all 4.3 billion IPv4 addresses on the public internet, whereas /32 isolates an exact individual host IP address.',
    },
    {
      id: 'sg-obj-3',
      title: 'Eliminate Administrative Protocol Exposure',
      description:
        'Learn why administrative protocols like SSH (22) and RDP (3389) must never be exposed to the public internet under any circumstances.',
    },
    {
      id: 'sg-obj-4',
      title: 'Maintain Segregation of Duties',
      description:
        'Restrict management traffic to verified administrative bastion ranges without disrupting end-user application ports (HTTP 80 and HTTPS 443).',
    },
  ],
  hints: [
    {
      id: 1,
      title: 'Examine Port 22 Inbound Source',
      text: "Inspect the inbound rules list. Look at the rule for port 22 (SSH). Its source CIDR is currently set to '0.0.0.0/0', which grants access to every computer on the internet.",
      penaltyPoints: 5,
    },
    {
      id: 2,
      title: 'Restrict to Approved Admin Bastion',
      text: "Update the source CIDR for port 22 to the authorized corporate bastion IP '203.0.113.50/32' or the corporate intranet range '10.0.0.0/16'. Alternatively, remove the SSH rule if administrative access is managed through Session Manager.",
      penaltyPoints: 10,
    },
    {
      id: 3,
      title: 'Preserve Public Web Ingress',
      text: 'Do not remove port 80 (HTTP) or port 443 (HTTPS) rules from 0.0.0.0/0. Those ports are required for legitimate customer traffic to reach the frontend service.',
      penaltyPoints: 10,
    },
  ],
  initialState: {
    type: 'security-group',
    config: {
      securityGroupId: 'sg-0e42a991f8c47b19',
      securityGroupName: 'app-prod-bastion-sg',
      description: 'Security group for production bastion and web ingress',
      vpcId: 'vpc-0a1b2c3d4e5f67890',
      inboundRules: [
        {
          id: 'rule-ssh-wildcard',
          protocol: 'tcp',
          portRange: '22',
          fromPort: 22,
          toPort: 22,
          source: '0.0.0.0/0',
          description: 'Emergency SSH debug access (Temporary)',
        },
        {
          id: 'rule-http',
          protocol: 'tcp',
          portRange: '80',
          fromPort: 80,
          toPort: 80,
          source: '0.0.0.0/0',
          description: 'Public HTTP web traffic',
        },
        {
          id: 'rule-https',
          protocol: 'tcp',
          portRange: '443',
          fromPort: 443,
          toPort: 443,
          source: '0.0.0.0/0',
          description: 'Public HTTPS secure web traffic',
        },
      ],
      outboundRules: [
        {
          id: 'rule-outbound-all',
          protocol: 'all',
          portRange: 'All',
          fromPort: 0,
          toPort: 0,
          source: '0.0.0.0/0',
          description: 'Allow all egress traffic',
        },
      ],
    },
  },
  recommendedState: {
    type: 'security-group',
    config: {
      securityGroupId: 'sg-0e42a991f8c47b19',
      securityGroupName: 'app-prod-bastion-sg',
      description: 'Security group for production bastion and web ingress',
      vpcId: 'vpc-0a1b2c3d4e5f67890',
      inboundRules: [
        {
          id: 'rule-ssh-restricted',
          protocol: 'tcp',
          portRange: '22',
          fromPort: 22,
          toPort: 22,
          source: '203.0.113.50/32',
          description: 'Secured corporate admin bastion SSH',
        },
        {
          id: 'rule-http',
          protocol: 'tcp',
          portRange: '80',
          fromPort: 80,
          toPort: 80,
          source: '0.0.0.0/0',
          description: 'Public HTTP web traffic',
        },
        {
          id: 'rule-https',
          protocol: 'tcp',
          portRange: '443',
          fromPort: 443,
          toPort: 443,
          source: '0.0.0.0/0',
          description: 'Public HTTPS secure web traffic',
        },
      ],
      outboundRules: [
        {
          id: 'rule-outbound-all',
          protocol: 'all',
          portRange: 'All',
          fromPort: 0,
          toPort: 0,
          source: '0.0.0.0/0',
          description: 'Allow all egress traffic',
        },
      ],
    },
  },
  educationalDebrief: {
    rootCause:
      'An emergency manual firewall rule was added directly in the AWS console without an expiration timer or change-review check, leaving the server exposed to automated port scanners.',
    realWorldImpact:
      'Open SSH ports are routinely breached through credential stuffing, unpatched OpenSSH vulnerabilities, and SSH key exfiltration, often leading to ransomware, lateral movement, or crypto-mining botnet enlistment.',
    preventionStrategy:
      'Use AWS Systems Manager (SSM) Session Manager instead of opening port 22 in security groups. Session Manager provides IAM-authenticated, auditable shell access without requiring public IP ingress or open bastions.',
    awsWellArchitectedPillar: 'Security — Infrastructure Protection & Network Security',
  },
  investigation: {
    alert: {
      service: 'Amazon GuardDuty',
      alertId: 'GD-EC2-SSH-BRUTEFORCE-092',
      severity: 'high',
      title: 'UnauthorizedAccess:EC2/SSHBruteForce',
      description:
        'EC2 instance attached to security group "sg-0e42a991f8c47b19" is experiencing high volume SSH brute force login attempts from known malicious IPs.',
      timestamp: '2026-10-18T03:14:02Z',
    },
    telemetryLogs: [
      {
        id: 'log-sg-1',
        source: 'CloudTrail',
        timestamp: '2026-10-18T03:12:18Z',
        event: 'AuthorizeSecurityGroupIngress',
        rawJsonOrText: JSON.stringify(
          {
            eventSource: 'ec2.amazonaws.com',
            eventName: 'AuthorizeSecurityGroupIngress',
            userIdentity: {
              type: 'IAMUser',
              userName: 'devops-oncall-emergency',
            },
            requestParameters: {
              groupId: 'sg-0e42a991f8c47b19',
              ipPermissions: {
                items: [
                  {
                    ipProtocol: 'tcp',
                    fromPort: 22,
                    toPort: 22,
                    ipRanges: {
                      items: [{ cidrIp: '0.0.0.0/0' }],
                    },
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
        id: 'log-sg-2',
        source: 'VPC Flow Logs',
        timestamp: '2026-10-18T03:13:50Z',
        event: 'FLOW_LOG_INGRESS_SSH',
        rawJsonOrText:
          '2 123456789012 eni-0123456789abcdef0 198.51.100.89 10.0.1.45 49152 22 6 24 1440 1760757230 1760757290 ACCEPT OK',
      },
    ],
    evidenceNotes: [
      'CloudTrail confirms on-call operator added 0.0.0.0/0 on port 22 directly from home Wi-Fi.',
      'VPC Flow logs demonstrate over 3,400 external TCP SYN connections ACCEPTED on port 22 in 15 minutes.',
      'Amazon GuardDuty flagged active SSH credential-stuffing attacks from known attacker subnets.',
    ],
  },
};
