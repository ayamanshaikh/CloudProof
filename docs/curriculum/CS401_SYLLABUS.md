# CS401: Cloud Infrastructure Security & Automated Incident Defense

**Course Level:** Upper-Division Undergraduate / Graduate  
**Prerequisites:** Introduction to Computer Networks (CS351) & Operating Systems (CS341)  
**Instructional Tool:** CloudProof Interactive Workbench & Verification Platform  

---

## 1. Course Description
CS401 provides comprehensive hands-on instruction in architecting, auditing, and defending enterprise cloud environments against configuration-based attacks. Utilizing the CloudProof flight simulator, students actively investigate and remediate real-world security incidents across storage, identity, compute, and networking.

---

## 2. 14-Week Schedule & CloudProof Mission Integration

| Week | Lecture Topic | Lab / CloudProof Incident Mission |
|---|---|---|
| **Week 1** | Shared Responsibility Model & Cloud Threat Vectors | Platform Onboarding & Sandbox Orientation |
| **Week 2** | Object Storage Security & Access Control Mechanics | S3 ACLs, Canned Policies, and Anonymous Grants |
| **Week 3** | S3 Block Public Access (BPA) & Defense-in-Depth | **Mission 1: The Public Invoice Bucket** |
| **Week 4** | IAM Architecture: Principals, Roles & Evaluation Logic | IAM Policy Structure (`Effect`, `Action`, `Resource`) |
| **Week 5** | Privilege Escalation Vectors & Least Privilege Scoping | **Mission 2: The Overprivileged Lambda Role** |
| **Week 6** | Cross-Account Security & STS AssumeRole Delegation | STS External ID Conditions & Trust Policies |
| **Week 7** | Virtual Private Clouds (VPC) & Subnet Architecture | Public vs Private Subnets, Route Tables, Internet Gateways |
| **Week 8** | Network Security Groups & Stateful Ingress Defense | **Mission 3: The World-Readable Database Port** |
| **Week 9** | **Midterm Practical Exam** | Controlled Multi-Stage Cloud Incident Triage |
| **Week 10** | Encryption at Rest: AWS KMS Customer Managed Keys | SSE-S3 vs SSE-KMS, Envelope Encryption |
| **Week 11** | Audit Logging & Threat Detection: AWS CloudTrail | CloudTrail Tamper-Resistance & S3 Data Events |
| **Week 12** | Compute Metadata Protection: IMDSv1 vs IMDSv2 | Preventing SSRF Exploits via IMDSv2 Enforcement |
| **Week 13** | Infrastructure as Code (Terraform) Security Scanning | Checkov, tfsec, and CI/CD Pre-Deployment Gates |
| **Week 14** | Student Capstone Incident Response Presentations | Review of Student Verified Portfolios & Certifications |
