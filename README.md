# CloudProof

> **Educational Cloud Incident & Automated Infrastructure Verification Platform**

[![CI - Backend](https://github.com/ayamanshaikh/CloudProof/actions/workflows/backend-ci.yml/badge.svg)](https://github.com/ayamanshaikh/CloudProof/actions/workflows/backend-ci.yml)
[![CI - Frontend](https://github.com/ayamanshaikh/CloudProof/actions/workflows/frontend-ci.yml/badge.svg)](https://github.com/ayamanshaikh/CloudProof/actions/workflows/frontend-ci.yml)
[![Security - CodeQL](https://github.com/ayamanshaikh/CloudProof/actions/workflows/security-scan.yml/badge.svg)](https://github.com/ayamanshaikh/CloudProof/actions/workflows/security-scan.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Python: 3.11+](https://img.shields.io/badge/Python-3.11%20%7C%203.12%20%7C%203.13-brightgreen.svg)](https://python.org)
[![Next.js: 14](https://img.shields.io/badge/Next.js-14%20(App%20Router)-black.svg)](https://nextjs.org)
[![Cloud Cost](https://img.shields.io/badge/Student%20Cost-%240.00%20Guaranteed-success.svg)](docs/PILOT_GUIDE.md)
[![AI Grading Hallucinations](https://img.shields.io/badge/AI%20Grading%20Hallucination-0.0%25-success.svg)](docs/RESEARCH_EVALUATION.md)

CloudProof is an educational flight simulator where students master cloud security by solving realistic infrastructure incidents, verified by a deterministic programmatic engine and debriefed through grounded AI post-mortems.


---

## Architecture Overview

* **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS
* **Backend:** FastAPI (Python 3.11+ / 3.13), Pydantic v2, Boto3
* **Database:** PostgreSQL (with SQLite support for zero-config local testing)
* **AI Layer:** Google Gemini API (via abstraction layer for grounded post-mortems)
* **Execution Modes:**
  * **Demo Mode:** Local deterministic simulation (zero AWS account / zero cost required)
  * **Real AWS Mode:** Least-privilege read-only verification via cross-account IAM role assumption

---

## Repository Structure

```text
cloudproof/
├── backend/                  # FastAPI REST API & Deterministic Rule Engine
│   ├── app/
│   │   ├── api/              # API Route endpoints (v1)
│   │   ├── core/             # Configuration, security, database
│   │   ├── models/           # SQLAlchemy database entities
│   │   ├── schemas/          # Pydantic v2 schemas
│   │   ├── engine/           # Verification engine, adapters, rules
│   │   └── ai/               # LLM abstraction and prompt templates
│   ├── requirements.txt      # Python dependencies
│   └── Dockerfile
├── frontend/                 # Next.js 14 Web Application
│   ├── app/                  # App Router pages and layouts
│   ├── components/           # UI components
│   ├── package.json          # Node dependencies
│   └── Dockerfile
├── missions/                 # Curated declarative mission definitions
├── docs/                     # Architecture & setup documentation
├── tests/                    # Backend automated tests
├── docker-compose.yml        # Multi-container orchestration
├── .gitignore
└── README.md
```

---

## Demo-First Quickstart (Zero Configuration)

CloudProof runs out-of-the-box as a standalone, deterministic cloud incident laboratory.
**No AWS accounts, no API keys, and no backend database are required for this demo.**

### Prerequisites
* **Node.js:** v18+ or v20+
* **npm:** v9+

### Running the Interactive Web Demo (Windows & macOS)

```bash
# 1. Navigate to the frontend directory
cd frontend

# 2. Install dependencies (first-time only)
npm install

# 3. Launch the development flight simulator
npm run dev
```

Open **[http://localhost:3001](http://localhost:3001)** in your browser to start exploring missions!

### Production Build & Verification

```bash
cd frontend
npm run typecheck   # Validate TypeScript types
npm run build       # Build optimized production bundle
```


---

## Comprehensive Documentation Suite

CloudProof includes production-grade documentation, classroom guides, academic research artifacts, and commercialization strategies:

* 📘 **[College Pilot & Instructor Guide](docs/PILOT_GUIDE.md)**: Complete faculty workflow, student incident workbench, classroom roster analytics, 4-tier virtual hint economy, and 1-click RFC 4180 CSV gradebook exports.
* 🚀 **[Production Deployment & Container Orchestration Guide](docs/DEPLOYMENT_GUIDE.md)**: Multi-profile Docker Compose architecture (`prod` with Nginx gateway & PostgreSQL, `sqlite` zero-cost lab mode), SSL hardening, and automated deployment scripts (`deploy.sh` & `deploy.ps1`).
* 🎬 **[Turnkey Demo & Showcase Presentation Guide](docs/DEMO_GUIDE.md)**: 12-stage end-to-end incident demonstration script, turnkey database seed CLI (`scripts/seed_demo.py`), and investor pitch walkthrough.
* 🎓 **[Empirical Research Evaluation & Statistical Analysis](docs/RESEARCH_EVALUATION.md)**: Publication-ready academic whitepaper evaluating RQ1–RQ4 across a controlled $N=20$ student trial, complete with inferential statistics ($t$-tests, $p < 0.0001$, Cohen's $d = -5.91$), Hake's normalized gain analysis ($g = 0.76$ High-Gain tier), and student error taxonomy.
* 💼 **[Startup Validation, Unit Economics & Pitch Deck](docs/STARTUP_VALIDATION.md)**: Institutional B2B SaaS pricing model ($0 student fees), unit economics breakdown ($95.8% gross margin, $0.10 COGS/student-semester), competitive moat analysis, and 10-slide investor pitch deck outline.


