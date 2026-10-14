# Contributing to CloudProof

Thank you for your interest in contributing to **CloudProof**! We welcome contributions from educators, students, security researchers, and software engineers to help improve cloud security pedagogy.

---

## 1. Code of Conduct

This project adheres to the [Contributor Covenant v2.1](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to `security@cloudproof.edu`.

---

## 2. Core Architectural Principles to Respect

When contributing code, you **must** adhere to CloudProof's core architectural constraints:

1. **The AI Separation Rule**: AI **never** determines pass/fail verdicts or student scores. Grading logic is strictly deterministic, programmatic, and executed via Python rule packs in `< 50ms`. The AI post-mortem module receives rule verdicts as read-only context.
2. **Dual-Mode Execution**: Every incident mission must support both:
   - **Mode A (Simulation)**: Zero-cost, local in-memory simulation with zero AWS credentials required.
   - **Mode B (Real AWS)**: Least-privilege, read-only cross-account verification using AWS STS `AssumeRole` with unique `ExternalId` conditions. No long-lived static AWS credentials may ever be stored.
3. **Zero Trash Code**: Maintain 100% test coverage, comprehensive type hints, and full cross-platform compatibility (Windows PowerShell, macOS, and Linux).

---

## 3. Development Workflow

### 3.1 Fork & Clone
```bash
git clone https://github.com/<your-username>/CloudProof.git
cd CloudProof
git checkout -b feature/your-feature-name
```

### 3.2 Backend Setup (FastAPI / Python 3.11+)
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
pytest tests/ -v
```

### 3.3 Frontend Setup (Next.js 14 / TypeScript)
```bash
cd frontend
npm install
npm run typecheck
npm run dev
```

---

## 4. Conventional Commit Guidelines

We use conventional commit messages for automated changelog generation and semantic versioning:

- `feat:` New user-facing feature (mission pack, workbench tool, API route)
- `fix:` Bug fix or patch
- `docs:` Documentation updates, syllabi, or research whitepapers
- `test:` Adding or updating automated tests
- `refactor:` Code change that neither fixes a bug nor adds a feature
- `ci:` Changes to CI/CD workflows and automated scripts
- `chore:` Tooling, dependency updates, or metadata

---

## 5. Submitting a Pull Request (PR)

1. Ensure all tests pass: `pytest tests/ -v`.
2. Ensure frontend type-checks with zero errors: `npm run typecheck` inside `frontend/`.
3. Push your branch to GitHub and open a Pull Request against `master`.
4. Provide a clear, detailed PR description outlining the motivation and verification steps.
