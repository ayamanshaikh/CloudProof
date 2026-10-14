# Terraform Module: AWS Student Sandbox Account Provisioner
# Provisions vulnerable cloud incident target resources for hands-on student remediation

terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

variable "environment" {
  type        = string
  default     = "sandbox"
  description = "Target environment name"
}

variable "student_id" {
  type        = string
  description = "Unique student or team identifier"
}

# Vulnerable target S3 bucket for Mission 1
resource "aws_s3_bucket" "invoice_bucket" {
  bucket        = "cloudproof-acme-invoices-${var.student_id}"
  force_destroy = true

  tags = {
    Project     = "CloudProof"
    StudentId   = var.student_id
    Environment = var.environment
  }
}

output "bucket_name" {
  value       = aws_s3_bucket.invoice_bucket.id
  description = "Target S3 bucket name"
}

output "bucket_arn" {
  value       = aws_s3_bucket.invoice_bucket.arn
  description = "Target S3 bucket ARN"
}
