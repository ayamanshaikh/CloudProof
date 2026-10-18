# CloudProof

> **Interactive Cloud Security Flight Simulator & Practical Infrastructure Education Platform**

[![Zero Cloud Cost](https://img.shields.io/badge/AWS%20Account%20Required-NO%20(%240.00)-success.svg)](#)
[![Deterministic Verification](https://img.shields.io/badge/Grading%20Engine-Deterministic%20(Sub--millisecond)-blue.svg)](#)
[![Offline Ready](https://img.shields.io/badge/Offline%20Ready-100%25%20Client--Side-brightgreen.svg)](#)
[![Next.js 14](https://img.shields.io/badge/Frontend-Next.js%2014%20(App%20Router)-black.svg)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript%205-blue.svg)](https://www.typescriptlang.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-teal.svg)](LICENSE)

---

## 1. Product Vision & Core Promise

> *"Learn cloud computing by solving real-world-inspired cloud incidents, understanding why they are dangerous, and verifying how the correct fix resolves them."*

Traditional cloud computing education is fundamentally broken. Students are either subjected to **passive multiple-choice exams** that test rote memorization, or forced to manage **expensive, risky live cloud accounts** where a single forgotten resource triggers unexpected monthly billing charges.

**CloudProof** transforms cloud security education into an interactive, high-fidelity flight simulator. Students inherit authentic production environments with subtle, dangerous misconfigurations, analyze simulated telemetry, apply surgical fixes, and receive instantaneous deterministic grading—**with zero AWS accounts, zero credentials, and zero runtime API costs**.

---

## 2. The 5-Stage Educational Workflow

```
   [01. DISCOVER]  ──►  [02. INVESTIGATE]  ──►  [03. FIX]  ──►  [04. VERIFY]  ──►  [05. UNDERSTAND]
 Inherit simulated     Analyze CloudTrail &     Apply surgical    Deterministic      Review pedagogical
   cloud incident         VPC Flow logs          remediation       0-100 scoring      post-mortem & CLI
```

1. **Discover:** Inherit a realistic cloud architecture (e.g., fintech invoice storage, database bastion host, microservice execution role) containing an active security vulnerability.
2. **Investigate:** Inspect simulated AWS CloudTrail logs, VPC Flow Logs, and AWS Security Hub alerts to observe how threat actors discover and exploit misconfigurations in the wild.
3. **Fix:** Use authentic cloud consoles (switches, firewall rule tables, IAM JSON editors) to remediate the vulnerability.
4. **Verify:** Trigger sub-millisecond programmatic rule verification that evaluates security invariants without unpredictable AI hallucinations or network latency.
5. **Understand:** Read plain-language architectural post-mortems, examine production AWS CLI command equivalents, and study alignment with the AWS Well-Architected Framework.

---

## 3. Two-Minute Walkthrough Guide for Evaluators & Professors

This demo is tailored for college evaluators, computer science professors, and cloud engineering instructors. You do not need prior AWS experience to evaluate the system.

### Quick Evaluation Path:

1. **Launch the Demo:**
   ```bash
   cd frontend
   npm run dev
   ```
   Open **[http://localhost:3001](http://localhost:3001)** in your browser.

2. **Open the Evaluator Tour:**
   - Click the **Evaluator Tour** badge in the top navigation bar at any time to open the guided 4-step modal.
   - Alternatively, navigate to **Missions** and select **The Leaky Bucket** (`/missions/s3-leaky-bucket`).

3. **Inspect Incident Telemetry (Pane 1):**
   - In the left pane under *Investigation & Telemetry*, inspect authentic CloudTrail JSON events showing unauthenticated `REST.GET.OBJECT` requests downloading customer invoice PDFs.
   - Click the **Diagnostic Hints** tab to test the 3-tier progressive hint system (with calculated score penalties).

4. **Test the One-Click "Reference Fix" (Pane 2):**
   - Click **Reference Fix** in the sticky top bar.
   - The interactive configurator will instantly apply the secure reference architecture (enabling all 4 S3 Block Public Access flags and setting the bucket ACL to private).

5. **Verify Sub-Millisecond Invariants:**
   - Click **Run Verification** (or observe automatic evaluation).
   - In under **1 millisecond**, the deterministic rule engine verifies all 3 rules, awarding a perfect **100/100 score** with verified evidence badges.

6. **Generate & Print the Evaluation Report Card:**
   - Click **Report Card** to open the official printable student certificate.
   - Click **Print / Save PDF** to view the clean, high-contrast academic evaluation sheet formatted with a unique cryptographic verification hash.

---

## 4. Curated Interactive Incident Missions

| Mission | Category | Cloud Service | Level | Est. Time | Focus Areas |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **The Leaky Bucket** | Storage Security | Amazon S3 | Beginner | 15 min | S3 Block Public Access (4 flags), Bucket Policy scoping, Canned ACLs |
| **Door Left Open** | Network Security | VPC Security Groups | Intermediate | 20 min | Inbound SSH (`0.0.0.0/0`, `::/0`) restriction, CIDR notation, web ingress |
| **Too Much Power** | Identity & Access | AWS IAM | Intermediate | 25 min | Wildcard `*` action replacement, least-privilege scoping, policy JSON validation |

### Mission 1: The Leaky Bucket
* **Scenario:** A fintech startup inadvertently exposed its invoice bucket to public internet crawlers.
* **Student Task:** Toggle defense-in-depth Block Public Access controls, sanitize bucket policy statements, and verify canned ACL privacy without breaking legitimate backend service access.

### Mission 2: Door Left Open
* **Scenario:** An engineering team opened port 22 (SSH) to `0.0.0.0/0` during emergency debugging and left it exposed to global brute-force botnets.
* **Student Task:** Analyze VPC Flow Logs (`REJECT`/`ACCEPT` packets from botnet IPs), restrict SSH to authorized office CIDR blocks (`198.51.100.0/24`), and preserve public HTTP/HTTPS traffic.

### Mission 3: Too Much Power
* **Scenario:** A backend Lambda processing role was assigned broad administrative access (`"Action": "*"`).
* **Student Task:** Detect privilege escalation risks, author least-privilege IAM statements (`s3:GetObject`, `s3:PutObject`, `s3:ListBucket`), and validate policy JSON syntax.

---

## 5. System Architecture & Engineering Principles

```
┌───────────────────────────────────────────────────────────────────────────┐
│                           BROWSER CLIENT (100% OFFLINE)                    │
│                                                                           │
│  ┌──────────────────────┐  ┌─────────────────────┐  ┌──────────────────┐  │
│  │   Next.js 14 App     │  │  Interactive Cloud  │  │ Deterministic    │  │
│  │   Semantic UI Tokens │◄─┤  Configurators      │─►│ Verifier Engine  │  │
│  │   Light & Dark Mode  │  │  (S3, SG, IAM Role) │  │ (Pure TypeScript)│  │
│  └──────────────────────┘  └─────────────────────┘  └─────────┬────────┘  │
│             ▲                                                 │           │
│             │                                                 ▼           │
│  ┌──────────┴───────────┐                           ┌──────────────────┐  │
│  │  Telemetry Logs      │                           │ Scoring (0-100)  │  │
│  │  CloudTrail/VPC Flow │                           │ Evidence Badges  │  │
│  └──────────────────────┘                           └──────────────────┘  │
└───────────────────────────────────────────────────────────────────────────┘
```

### Deterministic Rule Engine vs. AI/LLM Grading
CloudProof deliberately avoids non-deterministic Large Language Model (LLM) grading for core assessment:
- **Zero Hallucinations:** Grading is evaluated against strict programmatic invariants in pure TypeScript.
- **Sub-Millisecond Evaluation:** Tests evaluate in **< 1ms**, enabling live reactive feedback as students toggle switches.
- **Reproducible Academic Results:** The same configuration produces identical scores across 1,000 consecutive runs.

### Live Production AWS CLI Translation
As students modify controls in the browser console, CloudProof dynamically generates the exact, copyable production AWS CLI commands (e.g., `aws s3api put-public-access-block`, `aws ec2 revoke-security-group-ingress`, `aws iam put-role-policy`), bridging simulation with real-world infrastructure operations.

---

## 6. Getting Started & Running Locally

### Prerequisites
* **Node.js:** v18+ or v20+
* **npm:** v9+

### 1. Installation
```bash
git clone https://github.com/ayamanshaikh/CloudProof.git
cd CloudProof/frontend
npm install
```

### 2. Launch Local Development Server
```bash
npm run dev
```
Open **[http://localhost:3001](http://localhost:3001)** in your browser.

> *Note:* Port `3001` is preconfigured to prevent conflicts with other local services.

### 3. Run Automated Tests
```bash
npm test
```
Executes 18 automated unit and hardening tests (verifying edge cases, malformed JSON handling, CIDR range enclosures, and determinism guarantees).

### 4. Run TypeScript Typechecking
```bash
npm run typecheck
```
Performs zero-emission static type analysis across all components and mission engine modules.

### 5. Build for Production
```bash
npm run build
```
Generates an optimized static site export (SSG) with zero build errors and under 88 kB shared initial JavaScript.

---

## 7. Project Structure

```text
CloudProof/
├── frontend/
│   ├── app/                               # Next.js 14 App Router
│   │   ├── page.tsx                       # Landing Page (Hero, Value, Methodology)
│   │   ├── missions/                      # Mission Catalogue & Dynamic Workbench
│   │   │   ├── page.tsx                   # Catalogue with score progress badges
│   │   │   └── [missionId]/page.tsx       # Dynamic mission route
│   │   ├── how-it-works/page.tsx          # Pedagogical methodology & comparison
│   │   ├── future-vision/page.tsx         # 3-Phase expansion roadmap
│   │   ├── globals.css                    # Design tokens & print stylesheet
│   │   └── layout.tsx                     # Root metadata & font configuration
│   ├── components/                        # Universal layout components
│   │   ├── Navbar.tsx                     # Header with Evaluator Tour trigger
│   │   ├── Footer.tsx                     # Footnote with educational simulation notice
│   │   ├── ThemeToggle.tsx                # Light (#F6F4EF) & Dark (#0D1519) modes
│   │   └── EvaluatorGuideModal.tsx        # 4-step quick evaluator walkthrough
│   ├── features/missions/                 # Domain-driven mission system
│   │   ├── types.ts                       # Strongly typed mission schemas
│   │   ├── data/                          # Mission configurations & telemetry
│   │   │   ├── s3LeakyBucket.ts           # The Leaky Bucket definition
│   │   │   ├── sgDoorOpen.ts              # Door Left Open definition
│   │   │   └── iamTooMuchPower.ts         # Too Much Power definition
│   │   ├── engine/                        # Deterministic verification engine
│   │   │   ├── verifier.ts                # Invariant rules & evaluation logic
│   │   │   └── __tests__/verifier.test.ts # 18 unit & security tests
│   │   └── components/                    # Mission workbench components
│   │       ├── MissionWorkbench.tsx       # Split-pane interactive workspace
│   │       ├── MissionHeader.tsx          # Sticky score gauge & action bar
│   │       ├── MissionBriefing.tsx        # Briefing, telemetry, architecture tabs
│   │       ├── InvestigationInspector.tsx # CloudTrail & VPC Flow log viewers
│   │       ├── CliCommandPreview.tsx      # Live AWS CLI command generator
│   │       ├── VerificationPanel.tsx      # Itemized pass/fail rule results
│   │       ├── MissionCompletionModal.tsx # Celebratory debrief modal
│   │       ├── MissionReportCard.tsx      # Printable academic assessment certificate
│   │       └── configurators/             # S3, Security Group & IAM configurators
│   ├── tailwind.config.ts                 # Semantic color design tokens
│   ├── tsconfig.json                      # Strict TypeScript settings
│   └── package.json                       # Scripts and dependencies
└── README.md                              # Main platform documentation
```

---

## 8. Strategic Roadmap & Future Expansion

CloudProof is designed with an explicit three-phase architectural growth trajectory:

```
┌────────────────────────────────┐  ┌────────────────────────────────┐  ┌────────────────────────────────┐
│            PHASE I             │  │            PHASE II            │  │           PHASE III            │
│       Current Deliverable      │  │        Future Capability       │  │        Future Capability       │
│                                │  │                                │  │                                │
│ • Standalone flight simulator  │  │ • Ephemeral AWS STS AssumeRole │  │ • LTI 1.3 Canvas / Blackboard  │
│ • Deterministic client engine  │──┼─► • Terraform / CFN sandboxes  │──┼─► • Multi-cloud (Azure & GCP)   │
│ • 3 core incident missions     │  │ • Live infrastructure drift    │  │ • Class mistake heatmaps       │
│ • Zero credentials required    │  │ • Auto-teardown & budget limits│  │ • Linux eBPF / K8s labs        │
└────────────────────────────────┘  └────────────────────────────────┘  └────────────────────────────────┘
```

* **Phase I (Current MVP):** Standalone, zero-cost, 100% offline-capable browser flight simulator with sub-millisecond deterministic invariant verification.
* **Phase II (Future Scope):** Live cloud sandbox auditing using ephemeral AWS STS cross-account AssumeRole with `ExternalId` validation.
* **Phase III (Future Scope):** Higher-education LMS integration (Canvas, Blackboard, Moodle) via LTI 1.3, multi-cloud modules (Azure NSGs/Blobs, GCP IAM), and automated gradebook sync.

---

## 9. Absolute MVP Boundaries Maintained

To ensure zero friction, zero security risk, and zero hosting costs during evaluation:
- ❌ **No User Login / Signup:** Instant student access without registration barriers.
- ❌ **No Real Cloud Credentials:** No AWS Access Keys, Secret Keys, or IAM roles required.
- ❌ **No Paid AI APIs:** Zero runtime LLM dependencies or API key requirements.
- ❌ **No Heavy Database Servers:** Zero PostgreSQL, SQLite, or Supabase background processes.
- ❌ **No External Network Calls:** 100% offline functionality after dependency installation.

---

## 10. License & Contributing

Distributed under the **MIT License**. See `LICENSE` for details.

Developed for students, cloud educators, and evaluators seeking practical, hands-on mastery of cloud infrastructure security.
