# CloudProof: College Pilot & Instructor Guide

Welcome to **CloudProof**, an educational cloud incident remediation and automated verification platform designed for computer science and cybersecurity university courses.

CloudProof empowers students to master real-world cloud security incidents through active investigation, hands-on remediation, deterministic automated grading, and grounded AI-powered post-mortems.

---

## 1. Platform Philosophy & The 8-Stage Learning Loop

Traditional cloud labs either rely on passive multiple-choice quizzes or ungrounded LLM grading that hallucinates scores. CloudProof replaces both with an **automated, deterministic verification engine**:

$$\text{Learn} \longrightarrow \text{Practice} \longrightarrow \text{Break} \longrightarrow \text{Investigate} \longrightarrow \text{Fix} \longrightarrow \text{Verify} \longrightarrow \text{Understand} \longrightarrow \text{Prove}$$

### Core Architectural Guarantees:
1. **AI Separation Rule**: AI **never** determines pass/fail verdicts or student scores. Grading is 100% deterministic, executing programmatic rule suites with millisecond latency. The AI layer strictly explains the verified findings.
2. **Dual-Mode Flexibility**:
   - **Simulation Mode (Default)**: Zero cloud cost, instantaneous in-memory execution. No AWS accounts or credit cards required.
   - **Real AWS Mode**: Connects directly to student or university AWS accounts using secure cross-account STS `AssumeRole` with External ID conditions. Zero long-lived static AWS credentials are ever stored.
3. **Virtual Hint Economy**: Students manage a daily budget of virtual tokens. Unlocking hints applies tiered score deductions, reinforcing independent problem-solving before revealing code.

---

## 2. Quickstart Deployment

### Option A: Complete Docker Compose Deployment (Recommended for Production / Campus Server)

Ensure Docker Desktop or Docker Engine is installed and running:

```bash
# 1. Clone repository
git clone https://github.com/your-org/CloudProof.git
cd CloudProof

# 2. Configure environment
cp .env.example .env

# 3. Launch PostgreSQL, FastAPI backend, and Next.js frontend
docker compose up --build -d
```

Services will be accessible at:
* **Frontend Web App**: `http://localhost:3000`
* **FastAPI Backend Documentation**: `http://localhost:8000/docs`
* **PostgreSQL Database**: `localhost:5432`

---

### Option B: Local Developer Mode

#### 1. Backend (Python 3.13):
```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

#### 2. Frontend (Node.js 20+):
```powershell
cd frontend
npm install
npm run dev
```

The database auto-initializes and seeds default missions on first startup.

---

## 3. Instructor Guide

### 3.1 Registering as Faculty
1. Navigate to `http://localhost:3000/register`.
2. Use the quick-fill button **"Demo Instructor"** or enter your university credentials:
   - Role: `instructor`
   - Email: `professor@university.edu`
   - Password: `SecurePassword123!`
3. Sign in to access the **Instructor Command Center**.

### 3.2 Creating a Course Section
1. Click **"+ Create Course Section"** in the top navigation.
2. Enter the course name (e.g., `CS 485: Cloud Security & Defense`) and optional description.
3. CloudProof automatically assigns a unique, collision-free **Join Code** (e.g. `CP-8K9M`).
4. Share this join code with your enrolled students on your syllabus or LMS (Canvas, Blackboard).

### 3.3 Assigning Incident Missions
1. Select your created class section from the dashboard.
2. Click **"Assign Mission"** in the header.
3. Choose a curated incident from the catalog:
   - **Mission 1: The Public Invoice Bucket** (`missions/s3-public-invoices`)
     - Category: Storage Security & PII Protection
     - Scenario: Accidental exposure of corporate PDF invoices via public Amazon S3 access.
     - Severity: High
     - Base Score: 100 points
4. Set an optional due date and click **"Confirm Assignment"**.

### 3.4 Tracking Progress & Class Mistakes Matrix
The class detail page provides three real-time analytics views:
1. **Student Roster**: Live student list, enrollment dates, missions completed, and cumulative average grade.
2. **Class Progress Matrix**: Per-student status (`IN_PROGRESS`, `PASSED`, `FAILED`), final grades, and hint usage counters.
3. **Common Mistakes Analytics**: Aggregates failing rule checks across all students (e.g., identifying that 78% of students neglected `IgnorePublicAcls`), allowing targeted lecture review.

### 3.5 Exporting Official Gradebook (CSV)
1. On the class detail page, click **"Export Grades (CSV)"** in the top header.
2. CloudProof instantly streams an RFC 4180 compliant CSV file (`cloudproof_grades_<class_name>_<join_code>.csv`) containing:
   - Student Full Name & University Email
   - Mission Title
   - Attempt Status (`PASSED`, `FAILED`, `NOT_STARTED`)
   - Mode (`demo` / `real_aws`)
   - Base Score Earned
   - Hint Penalty Deductions
   - Final Grade ($\max(0, \text{Base} - \text{Hints})$)
   - Total Hints Used
   - Exact Verification Timestamp

---

## 4. Student Workflow

### 4.1 Enrolling in a Course
1. Students register at `http://localhost:3000/register` with role `student`.
2. On their dashboard, students click **"Join a Class"** and enter the professor's join code (e.g., `CP-8K9M`).
3. Assigned missions appear immediately in their active missions list.

### 4.2 The Incident Workbench
Clicking **"Start Mission"** opens the dedicated incident workbench:
1. **Incident Briefing**: Contextual simulated business scenario, affected assets, and active threat vector.
2. **S3 Block Public Access (BPA) Controls**: Interactive toggles for all 4 S3 BPA flags:
   - `BlockPublicAcls`
   - `IgnorePublicAcls`
   - `BlockPublicPolicy`
   - `RestrictPublicBuckets`
3. **Bucket Canned ACL**: Dropdown selector (`private`, `public-read`, `public-read-write`, `authenticated-read`).
4. **Bucket Policy JSON Editor**: Live syntax-checked IAM resource policy editor with instant reset capabilities.

### 4.3 Virtual Hint Economy
Students who need assistance click the **"Hints"** button in the header:
* Every student starts with **10 virtual tokens** (resetting daily at 00:00 UTC).
* Hints must be unlocked sequentially to prevent jumping straight to code:
  * **Tier 1 (1 Token, -5% Penalty)**: High-level architectural guidance and S3 evaluation semantics.
  * **Tier 2 (2 Tokens, -10% Penalty)**: Investigative angle directing attention to canned ACLs and BPA flags.
  * **Tier 3 (3 Tokens, -15% Penalty)**: Near-solution walkthrough explaining why wildcard bucket policies fail.
  * **Tier 4 (4 Tokens, -20% Penalty)**: Complete remediation policy and BPA flag settings.

### 4.4 Deterministic Verification & Automated Feedback
1. Students click **"Verify Fix"**.
2. The verification engine evaluates 6 programmatic rules in less than 50ms:
   * `CP-S3-001`: `BlockPublicAcls` is set to `True`
   * `CP-S3-002`: `IgnorePublicAcls` is set to `True`
   * `CP-S3-003`: `BlockPublicPolicy` is set to `True`
   * `CP-S3-004`: `RestrictPublicBuckets` is set to `True`
   * `CP-S3-005`: No bucket policy statement grants wildcard anonymous principal access
   * `CP-S3-006`: Bucket Canned ACL does not grant read/write permissions to public groups
3. The verdict modal shows exact pass/fail states, points earned per rule, and actual vs expected values.

### 4.5 AI Incident Post-Mortem & Debrief
Upon verification, students switch to the **AI Incident Post-Mortem** tab:
* Fully grounded in the deterministic rule outcomes and configuration diff.
* Structured into 6 educational sections:
  1. **Executive Incident Summary**: Simulated business context and remediation verdict.
  2. **Root Cause Analysis**: Deep dive into why the initial configuration permitted unauthorized public access.
  3. **Realistic Threat Exploit Scenario**: Monospace walkthrough showing how an attacker uses `aws s3 ls ... --no-sign-request` and enumeration tools to exfiltrate files.
  4. **Remediation Diff Breakdown**: Detailed diff of the student's changes.
  5. **Security Mechanics**: Explanation of AWS IAM evaluation logic, explicit vs implicit DENY, and defense-in-depth.
  6. **Production Best Practices**: Actionable guidance on AWS Organizations SCPs, KMS encryption, VPC Endpoints, and AWS Config rules.

---

## 5. Dual-Mode Operation Guide

| Capability | Mode A: Local Simulation | Mode B: Real AWS Integration |
|---|---|---|
| **Target Audience** | Introductory Courses, Large Labs, Self-Study | Advanced Cloud Security, Capstone Projects |
| **AWS Account Required?** | ❌ No | ✅ Yes (Student or Lab Account) |
| **Cloud Cost** | **\$0.00 Guaranteed** | Minimal (Standard S3 storage) |
| **Setup Time** | Instant (0 minutes) | ~2 minutes (One CloudFormation deploy) |
| **Authentication** | Local state engine | Cross-account STS `AssumeRole` + External ID |
| **Security Perimeter** | Sandboxed in-memory | Read-only least-privilege IAM policy |

### Enabling Real AWS Mode:
1. Deploy the turnkey CloudFormation template in the target AWS account:
   ```bash
   aws cloudformation deploy \
     --template-file missions/s3-public-invoices/cloudformation/template.yaml \
     --stack-name cloudproof-mission-1 \
     --parameter-overrides PlatformAccountId="123456789012" ExternalId="CP-STUDENT-EXTERNAL-ID" \
     --capabilities CAPABILITY_NAMED_IAM
   ```
2. The template provisions:
   - A vulnerable S3 bucket (`cloudproof-acme-invoices-<AWS_ACCOUNT_ID>`).
   - A read-only verification IAM role (`CloudProofVerificationRole`) with strict External ID trust conditions.
3. When starting a mission attempt, select **"Real AWS Mode"**, supply the 12-digit AWS Account ID, and CloudProof automatically assumes the role using temporary STS credentials to audit the live S3 bucket.

---

## 6. Faculty FAQ & Troubleshooting

**Q: Does CloudProof store AWS root or IAM user access keys?**  
**A:** Never. CloudProof strictly adheres to AWS security best practices. Only temporary, short-lived STS tokens generated via `AssumeRole` with unique `sts:ExternalId` validations are used during active verification.

**Q: Can a student cheat by prompting the AI to pass their lab?**  
**A:** No. The AI model is physically decoupled from the verification pipeline. The database state and grading logic execute in Python code using deterministic rules. The AI receives the rule engine's verdict as read-only context to generate educational explanations.

**Q: Can CloudProof run without an internet connection?**  
**A:** Yes. The built-in `DeterministicOfflineLLMProvider` generates structured, grounded 6-part post-mortems using rule engine findings even when completely offline or without a Google Gemini API key.

---

## 7. Support & Contributions
For issues, feature requests, or creating custom university mission packs, refer to the repository issue tracker or contact `support@cloudproof.edu`.
