# Changelog

All notable changes to the **CloudProof** platform will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-10-14

### Added
- **Core Architecture & Flight Simulator Loop**:
  - 8-stage active learning cycle: *Learn $\rightarrow$ Practice $\rightarrow$ Break $\rightarrow$ Investigate $\rightarrow$ Fix $\rightarrow$ Verify $\rightarrow$ Understand $\rightarrow$ Prove*.
  - AI Separation Rule: Grading is 100% deterministic (Python rule pack invariants evaluated in $< 50\text{ms}$); generative AI is strictly isolated to structured 6-part post-mortem debriefs.
  - Dual-Mode Execution: Mode A (Zero-cost local simulation) and Mode B (Real AWS cross-account STS `AssumeRole` with External ID).

- **Missions & Incident Scenarios**:
  - **Mission 1 (`s3-public-invoices`)**: Storage security, S3 Block Public Access (BPA) flag inheritance, canned ACL remediation, and wildcard principal policy elimination.
  - **Mission 2 (`iam-overprivileged-lambda`)**: IAM security, `AdministratorAccess` policy detachment, least-privilege resource scoping, and CloudWatch execution log preservation.
  - **Mission 3 (`vpc-exposed-database`)**: Network security, VPC security group ingress rules, database port 5432 RFC 1918 private subnet restriction, and 0.0.0.0/0 SSH removal.
  - **Mission 4 (`kms-unencrypted-secrets`)**: Cryptographic protection, mandatory SSE-KMS Customer Managed Key enforcement, S3 Bucket Key cost reduction, and automated key rotation.

- **Classroom & Instructor Experience**:
  - Faculty Command Center: Course section management, collision-free join codes (`SEC401`), and real-time student mistake matrix.
  - Gradebook Integration: 1-click RFC 4180 compliant CSV gradebook streaming.
  - De-Identified Research Export: FERPA/IRB compliant pseudonymized dataset export (`P-xxx`).

- **Student Workbench & Portfolio**:
  - Interactive configuration editor for S3 BPA flags, IAM policies, and VPC security groups.
  - Tiered Virtual Hint Economy: 10 daily tokens, 4-tier progressive score deduction hints.
  - Verified Skills Portfolio & Cryptographically Signed Certificate Badges.

- **Empirical Research & Validation**:
  - Controlled 20-student pilot evaluation ($N=20$) demonstrating $46.4\%$ faster resolution ($p < 0.0001, d = -5.91$), $0.0\%$ scoring hallucinations, and High-Gain conceptual mastery ($g = 0.76$).
  - Publication-grade academic whitepaper (`docs/RESEARCH_EVALUATION.md`) and statistical analysis engine (`scripts/research_statistical_analysis.py`).

- **Developer Tooling & Infrastructure**:
  - Turnkey 12-stage demo showcase runner (`scripts/demo_walkthrough.py --auto`) and database seeder (`scripts/seed_demo.py --clean`).
  - Rule engine micro-benchmark tool (`scripts/benchmark_engine.py`) and environment diagnostics CLI (`scripts/diagnose_environment.py`).
  - Multi-profile Docker Compose orchestration (`prod`, `sqlite`) and Nginx reverse proxy gateway.
  - Terraform modules for student sandbox environments and least-privilege STS verification roles.
  - Official Python client SDK (`sdk/python/cloudproof_client.py`).
  - GitHub Actions CI/CD workflows for backend matrix tests, Next.js build, and CodeQL security scanning.
