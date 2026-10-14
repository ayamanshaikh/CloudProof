# Root Terraform Deployment Example: Dev / Campus Lab Environment
terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "cloudproof_account_id" {
  type        = string
  default     = "123456789012"
  description = "Central CloudProof verification AWS account ID"
}

variable "student_external_id" {
  type        = string
  default     = "CP-SEC401-STUDENT-01"
  description = "Assigned student external ID"
}

module "student_sandbox" {
  source      = "../../modules/aws-sandbox"
  student_id  = "dev-student-01"
  environment = "dev"
}

module "verification_role" {
  source                = "../../modules/verification-role"
  cloudproof_account_id = var.cloudproof_account_id
  external_id           = var.student_external_id
}

output "sandbox_bucket_name" {
  value = module.student_sandbox.bucket_name
}

output "verification_role_arn" {
  value = module.verification_role.role_arn
}
