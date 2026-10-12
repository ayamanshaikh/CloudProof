# CloudProof

> **Educational Cloud Incident & Automated Infrastructure Verification Platform**

CloudProof is a hands-on cloud learning and assessment platform where students learn cloud computing by solving realistic infrastructure incidents and receive automatic verification and intelligent guidance.

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

## Local Development Setup

### Prerequisites
* **Node.js:** v18+ or v20+
* **Python:** 3.11+ (Python 3.13 supported)
* **Git**
* *(Optional)* Docker Desktop (for containerized PostgreSQL)

---

### 1. Environment Configuration

Copy the example environment template:

```bash
# Windows (PowerShell)
Copy-Item .env.example .env

# macOS / Linux
cp .env.example .env
```

---

### 2. Backend Setup

#### On Windows (PowerShell):
```powershell
cd backend
py -3.13 -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

#### On macOS / Linux (Bash):
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Verify backend health: `http://localhost:8000/api/v1/health`

---

### 3. Frontend Setup

#### On Windows / macOS / Linux:
```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000` in your browser.

---

### 4. Running Automated Tests

```bash
# Run pytest from the repository root
pytest tests/ -v
```

---

### 5. Running with Docker Compose (Full Stack)

```bash
docker compose up --build
```

---

## Comprehensive Documentation Suite

CloudProof includes production-grade documentation, classroom guides, academic research artifacts, and commercialization strategies:

* 📘 **[College Pilot & Instructor Guide](docs/PILOT_GUIDE.md)**: Complete faculty workflow, student incident workbench, classroom roster analytics, 4-tier virtual hint economy, and 1-click RFC 4180 CSV gradebook exports.
* 🚀 **[Production Deployment & Container Orchestration Guide](docs/DEPLOYMENT_GUIDE.md)**: Multi-profile Docker Compose architecture (`prod` with Nginx gateway & PostgreSQL, `sqlite` zero-cost lab mode), SSL hardening, and automated deployment scripts (`deploy.sh` & `deploy.ps1`).
* 🎬 **[Turnkey Demo & Showcase Presentation Guide](docs/DEMO_GUIDE.md)**: 12-stage end-to-end incident demonstration script, turnkey database seed CLI (`scripts/seed_demo.py`), and investor pitch walkthrough.
* 🎓 **[Empirical Research Evaluation & Statistical Analysis](docs/RESEARCH_EVALUATION.md)**: Publication-ready academic whitepaper evaluating RQ1–RQ4 across a controlled $N=20$ student trial, complete with inferential statistics ($t$-tests, $p < 0.0001$, Cohen's $d = -5.91$), Hake's normalized gain analysis ($g = 0.76$ High-Gain tier), and student error taxonomy.
* 💼 **[Startup Validation, Unit Economics & Pitch Deck](docs/STARTUP_VALIDATION.md)**: Institutional B2B SaaS pricing model ($0 student fees), unit economics breakdown ($95.8% gross margin, $0.10 COGS/student-semester), competitive moat analysis, and 10-slide investor pitch deck outline.


