/**
 * CloudProof - Mission Types & Simulation Schema
 *
 * Defines strictly typed structures for:
 * 1. Mission Metadata & Educational Curricula
 * 2. Simulated Resource Configurations (S3, Security Groups, IAM)
 * 3. Deterministic Verification Rules and Evaluation Results
 */

export type MissionCategory =
  | 'Storage Security'
  | 'Network Security'
  | 'Identity & Access';

export type MissionDifficulty = 'Beginner' | 'Intermediate' | 'Advanced';

export type SeverityLevel = 'critical' | 'high' | 'medium' | 'low';

export type RuleEvaluationStatus = 'pass' | 'fail' | 'partial';

export type OverallVerificationStatus = 'passed' | 'failed' | 'partial';

// ==========================================
// 1. S3 Storage Security Mission State
// ==========================================

export interface S3BlockPublicAccess {
  blockPublicAcls: boolean;
  ignorePublicAcls: boolean;
  blockPublicPolicy: boolean;
  restrictPublicBuckets: boolean;
}

export type S3BucketAcl = 'private' | 'public-read' | 'public-read-write';

export interface S3MissionConfig {
  bucketName: string;
  region: string;
  blockPublicAccess: S3BlockPublicAccess;
  bucketAcl: S3BucketAcl;
  bucketPolicy: string; // JSON string
  serverSideEncryption: boolean;
  versioning: boolean;
}

// ==========================================
// 2. Security Group Network Security Mission State
// ==========================================

export interface SecurityGroupRule {
  id: string;
  protocol: 'tcp' | 'udp' | 'icmp' | 'all';
  portRange: string;
  fromPort: number;
  toPort: number;
  source: string; // CIDR (e.g., '0.0.0.0/0', '203.0.113.50/32')
  description: string;
}

export interface SecurityGroupMissionConfig {
  securityGroupId: string;
  securityGroupName: string;
  description: string;
  vpcId: string;
  inboundRules: SecurityGroupRule[];
  outboundRules: SecurityGroupRule[];
}

// ==========================================
// 3. IAM Role Identity Security Mission State
// ==========================================

export interface IAMStatement {
  Sid?: string;
  Effect: 'Allow' | 'Deny';
  Principal?: unknown;
  Action: string | string[];
  Resource: string | string[];
  Condition?: Record<string, unknown>;
}

export interface IAMPolicyDocument {
  Version: string;
  Statement: IAMStatement[];
}

export interface IAMPolicyItem {
  id: string;
  name: string;
  policyDocument: string; // JSON string
}

export interface IAMRoleMissionConfig {
  roleName: string;
  roleArn: string;
  assumeRolePolicyDocument: string;
  inlinePolicies: IAMPolicyItem[];
}

// ==========================================
// Union Configuration Wrapper
// ==========================================

export type MissionState =
  | { type: 's3'; config: S3MissionConfig }
  | { type: 'security-group'; config: SecurityGroupMissionConfig }
  | { type: 'iam-role'; config: IAMRoleMissionConfig };

// ==========================================
// 4. Verification & Evaluation Types
// ==========================================

export interface RuleCheckResult {
  id: string;
  name: string;
  status: RuleEvaluationStatus;
  score: number;
  maxScore: number;
  severity: SeverityLevel;
  finding: string;
  explanation: string;
  recommendation: string;
}

export interface VerificationResult {
  missionId: string;
  overallStatus: OverallVerificationStatus;
  score: number; // 0 - 100
  maxScore: number; // 100
  rules: RuleCheckResult[];
  summary: string;
  educationalTakeaways: string[];
  evaluatedAt: string;
}

// ==========================================
// 5. Pedagogical Mission Metadata
// ==========================================

export interface LearningObjective {
  id: string;
  title: string;
  description: string;
}

export interface MissionHint {
  id: number;
  title: string;
  text: string;
  penaltyPoints: number;
}

export interface EducationalDebrief {
  rootCause: string;
  realWorldImpact: string;
  preventionStrategy: string;
  awsWellArchitectedPillar: string;
}

export interface Mission {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  category: MissionCategory;
  service: string;
  difficulty: MissionDifficulty;
  estimatedMinutes: number;
  tags: string[];
  shortDescription: string;
  scenarioDescription: string;
  incidentBackground: string;
  architectureOverview: {
    component: string;
    resourceId: string;
    region: string;
    tags: Record<string, string>;
  };
  learningObjectives: LearningObjective[];
  hints: MissionHint[];
  initialState: MissionState;
  recommendedState: MissionState;
  educationalDebrief: EducationalDebrief;
}
