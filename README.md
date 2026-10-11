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

## Documentation & Pilot Guide

For detailed university adoption, instructor workflows, and student mission walkthroughs, refer to the [College Pilot & Instructor Guide](docs/PILOT_GUIDE.md):

* **Instructor Workflow**: Creating course sections, join codes, assigning missions, tracking common mistakes, and 1-click CSV gradebook export.
* **Student Experience**: Incident Workbench, S3 Block Public Access & Policy editors, and the 4-tiered Virtual Hint Economy.
* **Automated Verification**: Deterministic program rules with millisecond execution (Zero AI hallucination).
* **AI Security Post-Mortem**: Grounded 6-part incident debriefs powered by Google Gemini (`gemini-3.8-flash`) with offline fallback.
* **Dual-Mode Setup**: Mode A (Zero-cost simulation) vs Mode B (Real AWS cross-account STS `AssumeRole`).

