# Cloud Incident Triage & Remediation Quick Reference

A student reference sheet for diagnosing and remediating common AWS cloud security incidents in CloudProof.

---

## 1. Amazon S3 Storage Security

### Block Public Access (BPA) Matrix
| Setting | Recommended Value | Impact |
|---|---|---|
| `BlockPublicAcls` | `True` | Rejects new public ACLs on bucket and objects. |
| `IgnorePublicAcls` | `True` | Causes S3 to ignore **all existing** public ACL grants. |
| `BlockPublicPolicy` | `True` | Rejects bucket policies granting public access. |
| `RestrictPublicBuckets` | `True` | Restricts bucket access strictly to authorized AWS accounts. |

### Canonical Bucket Policy Template (Private Least Privilege)
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowOnlyAppRole",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::123456789012:role/AppRole"
      },
      "Action": [
        "s3:GetObject",
        "s3:PutObject"
      ],
      "Resource": "arn:aws:s3:::cloudproof-acme-invoices/*"
    }
  ]
}
```

---

## 2. AWS IAM Least Privilege

### Avoiding Privilege Escalation
1. **Never attach `AdministratorAccess`** to application roles (Lambda, ECS, EC2).
2. **Preserve CloudWatch Logging:** Ensure Lambda roles retain `AWSLambdaBasicExecutionRole` (`arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole`).
3. **Explicit Resource Scoping:** Specify exact bucket or table ARNs in `Resource` blocks rather than wildcard `*`.
