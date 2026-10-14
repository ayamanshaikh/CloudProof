# Terraform Module: CloudProof STS Cross-Account Verification Role
# Provisions a least-privilege, read-only IAM role with strict External ID trust

variable "cloudproof_account_id" {
  type        = string
  description = "The 12-digit AWS Account ID of the CloudProof central platform"
}

variable "external_id" {
  type        = string
  description = "The secret student or class external ID required for AssumeRole"
}

data "aws_iam_policy_document" "assume_role_trust" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRole"]

    principals {
      type        = "AWS"
      identifiers = ["arn:aws:iam::${var.cloudproof_account_id}:root"]
    }

    condition {
      test     = "StringEquals"
      variable = "sts:ExternalId"
      values   = [var.external_id]
    }
  }
}

resource "aws_iam_role" "verification_role" {
  name               = "CloudProofVerificationRole"
  assume_role_policy = data.aws_iam_policy_document.assume_role_trust.json

  tags = {
    Project = "CloudProof"
    ManagedBy = "Terraform"
  }
}

# Least-privilege read-only verification policy
resource "aws_iam_role_policy" "verification_policy" {
  name = "CloudProofReadOnlyVerification"
  role = aws_iam_role.verification_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowReadOnlyS3Inspection"
        Effect = "Allow"
        Action = [
          "s3:GetBucketPublicAccessBlock",
          "s3:GetBucketPolicy",
          "s3:GetBucketAcl"
        ]
        Resource = "*"
      },
      {
        Sid    = "AllowReadOnlyIAMInspection"
        Effect = "Allow"
        Action = [
          "iam:GetRole",
          "iam:GetRolePolicy",
          "iam:ListAttachedRolePolicies"
        ]
        Resource = "*"
      },
      {
        Sid    = "AllowReadOnlyEC2Inspection"
        Effect = "Allow"
        Action = [
          "ec2:DescribeSecurityGroups",
          "ec2:DescribeSecurityGroupRules"
        ]
        Resource = "*"
      }
    ]
  })
}

output "role_arn" {
  value       = aws_iam_role.verification_role.arn
  description = "ARN of the verification role to provide to CloudProof"
}
