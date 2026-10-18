import test from 'node:test';
import assert from 'node:assert/strict';

import { s3LeakyBucketMission } from '../../data/s3LeakyBucket';
import { sgDoorOpenMission } from '../../data/sgDoorOpen';
import { iamTooMuchPowerMission } from '../../data/iamTooMuchPower';
import {
  verifyS3LeakyBucket,
  verifySecurityGroupDoorOpen,
  verifyIAMTooMuchPower,
  verifyMissionState,
} from '../verifier';
import { S3MissionConfig, SecurityGroupMissionConfig, IAMRoleMissionConfig } from '../../types';

test('S3 Leaky Bucket: Initial broken state scores 0 and fails all rules', () => {
  const initialState = s3LeakyBucketMission.initialState;
  assert.equal(initialState.type, 's3');

  const result = verifyS3LeakyBucket(initialState.config as S3MissionConfig);
  assert.equal(result.overallStatus, 'failed');
  assert.equal(result.score, 0);
  assert.equal(result.maxScore, 100);
  assert.equal(result.rules.length, 3);

  // BPA rule check
  const bpaRule = result.rules.find((r) => r.id === 's3-bpa-check');
  assert.ok(bpaRule);
  assert.equal(bpaRule.status, 'fail');
  assert.equal(bpaRule.score, 0);

  // Policy rule check
  const policyRule = result.rules.find((r) => r.id === 's3-policy-check');
  assert.ok(policyRule);
  assert.equal(policyRule.status, 'fail');
  assert.equal(policyRule.score, 0);

  // ACL rule check
  const aclRule = result.rules.find((r) => r.id === 's3-acl-check');
  assert.ok(aclRule);
  assert.equal(aclRule.status, 'fail');
  assert.equal(aclRule.score, 0);
});

test('S3 Leaky Bucket: Recommended state scores 100 and passes all rules', () => {
  const recommendedState = s3LeakyBucketMission.recommendedState;
  assert.equal(recommendedState.type, 's3');

  const result = verifyS3LeakyBucket(recommendedState.config as S3MissionConfig);
  assert.equal(result.overallStatus, 'passed');
  assert.equal(result.score, 100);
  assert.equal(result.maxScore, 100);
  assert.equal(result.rules.every((r) => r.status === 'pass'), true);
});

test('S3 Leaky Bucket: Partial fix awards deterministic intermediate points', () => {
  const partialConfig: S3MissionConfig = {
    bucketName: 'test-bucket',
    region: 'us-east-1',
    blockPublicAccess: {
      blockPublicAcls: true,
      ignorePublicAcls: true,
      blockPublicPolicy: false,
      restrictPublicBuckets: false,
    },
    bucketAcl: 'private', // +30 points
    bucketPolicy: '', // +35 points (empty policy = no public wildcard read)
    serverSideEncryption: true,
    versioning: true,
  };

  const result = verifyS3LeakyBucket(partialConfig);
  assert.equal(result.overallStatus, 'partial');
  // BPA has 2 of 4 enabled -> round(2/4 * 35) = 18 points.
  // Policy has 35 points.
  // ACL has 30 points.
  // Total = 18 + 35 + 30 = 83
  assert.equal(result.score, 83);
  const bpaRule = result.rules.find((r) => r.id === 's3-bpa-check');
  assert.ok(bpaRule);
  assert.equal(bpaRule.status, 'partial');
  assert.equal(bpaRule.score, 18);
});

test('Security Group Door Left Open: Initial broken state exposes SSH to 0.0.0.0/0', () => {
  const initialState = sgDoorOpenMission.initialState;
  assert.equal(initialState.type, 'security-group');

  const result = verifySecurityGroupDoorOpen(initialState.config as SecurityGroupMissionConfig);
  assert.equal(result.overallStatus, 'partial'); // Has web ports open (25), but fails SSH rules (0 + 0)
  assert.equal(result.score, 25);

  const sshRule = result.rules.find((r) => r.id === 'sg-ssh-no-wildcard');
  assert.ok(sshRule);
  assert.equal(sshRule.status, 'fail');
  assert.equal(sshRule.score, 0);

  const webRule = result.rules.find((r) => r.id === 'sg-web-ports-preserved');
  assert.ok(webRule);
  assert.equal(webRule.status, 'pass');
  assert.equal(webRule.score, 25);
});

test('Security Group Door Left Open: Recommended state scores 100/100', () => {
  const recommendedState = sgDoorOpenMission.recommendedState;
  assert.equal(recommendedState.type, 'security-group');

  const result = verifySecurityGroupDoorOpen(recommendedState.config as SecurityGroupMissionConfig);
  assert.equal(result.overallStatus, 'passed');
  assert.equal(result.score, 100);
  assert.equal(result.rules.every((r) => r.status === 'pass'), true);
});

test('Security Group Door Left Open: Closing web ports deducts points', () => {
  const badFixConfig: SecurityGroupMissionConfig = {
    securityGroupId: 'sg-test',
    securityGroupName: 'test-sg',
    description: 'test',
    vpcId: 'vpc-123',
    inboundRules: [
      {
        id: 'ssh-restricted',
        protocol: 'tcp',
        portRange: '22',
        fromPort: 22,
        toPort: 22,
        source: '203.0.113.50/32',
        description: 'admin',
      },
      // Student accidentally deleted ports 80 and 443!
    ],
    outboundRules: [],
  };

  const result = verifySecurityGroupDoorOpen(badFixConfig);
  assert.equal(result.overallStatus, 'partial');
  // SSH no wildcard = 45, SSH restricted = 30, Web ports = 0. Total = 75
  assert.equal(result.score, 75);
  const webRule = result.rules.find((r) => r.id === 'sg-web-ports-preserved');
  assert.ok(webRule);
  assert.equal(webRule.status, 'fail');
  assert.equal(webRule.score, 0);
});

test('IAM Too Much Power: Initial broken state has wildcard AdministratorAccess', () => {
  const initialState = iamTooMuchPowerMission.initialState;
  assert.equal(initialState.type, 'iam-role');

  const result = verifyIAMTooMuchPower(initialState.config as IAMRoleMissionConfig);
  assert.equal(result.overallStatus, 'failed');
  assert.equal(result.score, 0);
  assert.equal(result.rules.every((r) => r.status === 'fail'), true);
});

test('IAM Too Much Power: Recommended state scores 100/100', () => {
  const recommendedState = iamTooMuchPowerMission.recommendedState;
  assert.equal(recommendedState.type, 'iam-role');

  const result = verifyIAMTooMuchPower(recommendedState.config as IAMRoleMissionConfig);
  assert.equal(result.overallStatus, 'passed');
  assert.equal(result.score, 100);
  assert.equal(result.rules.every((r) => r.status === 'pass'), true);
});

test('IAM Too Much Power: Partial scoping awards partial score', () => {
  const partialConfig: IAMRoleMissionConfig = {
    roleName: 'test-role',
    roleArn: 'arn:aws:iam::123:role/test-role',
    assumeRolePolicyDocument: '{}',
    inlinePolicies: [
      {
        id: 'p1',
        name: 'ScopedS3Only',
        policyDocument: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: ['s3:GetObject'],
              Resource: ['arn:aws:s3:::company-order-raw-events/*'],
            },
          ],
        }),
      },
    ],
  };

  const result = verifyIAMTooMuchPower(partialConfig);
  assert.equal(result.overallStatus, 'partial');
  // No wildcard action = 40, No wildcard resource = 30, S3 configured but missing DynamoDB = 15. Total = 85
  assert.equal(result.score, 85);
  const leastPrivRule = result.rules.find((r) => r.id === 'iam-least-privilege-scoped');
  assert.ok(leastPrivRule);
  assert.equal(leastPrivRule.status, 'partial');
  assert.equal(leastPrivRule.score, 15);
});

test('Unified Dispatcher: Evaluates all 3 missions correctly through verifyMissionState', () => {
  const s3Res = verifyMissionState('s3-leaky-bucket', s3LeakyBucketMission.recommendedState);
  assert.equal(s3Res.score, 100);

  const sgRes = verifyMissionState('sg-door-open', sgDoorOpenMission.recommendedState);
  assert.equal(sgRes.score, 100);

  const iamRes = verifyMissionState('iam-too-much-power', iamTooMuchPowerMission.recommendedState);
  assert.equal(iamRes.score, 100);
});

test('Unified Dispatcher: Throws on unknown mission ID or mismatched state', () => {
  assert.throws(() => {
    verifyMissionState('unknown-mission', s3LeakyBucketMission.initialState);
  }, /Unknown mission ID/);

  assert.throws(() => {
    verifyMissionState('s3-leaky-bucket', sgDoorOpenMission.initialState);
  }, /Invalid state type/);
});
