# CloudProof Educational Grading Rubrics & Learning Outcomes

This document establishes standard academic grading rubrics and learning outcomes for each core incident mission.

---

## Mission 1: The Public Invoice Bucket (Storage Security)

### Core Learning Outcomes (CLO)
- **CLO 1.1:** Differentiate between Amazon S3 Access Control Lists (ACLs) and Bucket Policies.
- **CLO 1.2:** Analyze the four controls of S3 Block Public Access (BPA) and describe their override mechanics.
- **CLO 1.3:** Construct IAM bucket policy statements enforcing least-privilege principal access.

### Point Distribution (100 Points Total)
| Rule ID | Invariant Checked | Points | Failure Deduction |
|---|---|---|---|
| `CP-S3-001` | `BlockPublicAcls` set to `True` | 20 pts | -20 pts |
| `CP-S3-002` | `IgnorePublicAcls` set to `True` | 20 pts | -20 pts |
| `CP-S3-003` | `BlockPublicPolicy` set to `True` | 20 pts | -20 pts |
| `CP-S3-004` | `RestrictPublicBuckets` set to `True` | 20 pts | -20 pts |
| `CP-S3-005` | Elimination of Wildcard (`*`) Principal in Bucket Policy | 10 pts | -10 pts |
| `CP-S3-006` | Elimination of Public Canned ACL (`public-read`) | 10 pts | -10 pts |

*Hint Deductions:* Tier 1 (-5%), Tier 2 (-10%), Tier 3 (-15%), Tier 4 (-20%).

---

## Mission 2: The Overprivileged Lambda Role (IAM Security)

### Core Learning Outcomes (CLO)
- **CLO 2.1:** Detect and mitigate privilege escalation vectors in AWS IAM roles.
- **CLO 2.2:** Separate execution permissions from administrator policies.
- **CLO 2.3:** Maintain CloudWatch audit logging while enforcing least-privilege scoping.

### Point Distribution (100 Points Total)
| Rule ID | Invariant Checked | Points | Failure Deduction |
|---|---|---|---|
| `CP-IAM-001` | Detach `AdministratorAccess` managed policy | 35 pts | -35 pts |
| `CP-IAM-002` | Retain `AWSLambdaBasicExecutionRole` for CloudWatch logging | 25 pts | -25 pts |
| `CP-IAM-003` | Restrict S3 actions strictly to target invoice bucket | 25 pts | -25 pts |
| `CP-IAM-004` | Restrict trust relationship strictly to `lambda.amazonaws.com` | 15 pts | -15 pts |
