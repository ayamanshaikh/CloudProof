# Security Policy & Vulnerability Disclosure

Security is a foundational tenet of **CloudProof**. We take security reports seriously and are committed to maintaining a safe learning platform for universities and students.

---

## 1. Supported Versions

Security updates and patches are actively applied to the following versions of CloudProof:

| Version | Supported | Notes |
|---|---|---|
| `1.0.x` | :white_check_mark: | Current Active Release |
| `< 1.0.0` | :x: | Deprecated Alpha / Beta Builds |

---

## 2. Reporting a Vulnerability

If you discover a potential security vulnerability in CloudProof, please report it responsibly. **Do not create a public GitHub issue.**

### 2.1 Private Reporting Channel
- Email your findings directly to **`security@cloudproof.edu`**.
- Encrypt your report using our PGP key if transmitting sensitive proofs-of-concept.

### 2.2 What to Include in Your Report
To help us triage and resolve the issue quickly, please provide:
1. **Description:** A detailed explanation of the vulnerability and its potential impact.
2. **Affected Components:** Specific files, endpoints, or rule verification packs involved.
3. **Reproduction Steps:** Step-by-step instructions or proof-of-concept scripts.
4. **Proposed Mitigation:** Any suggested fixes or architectural remediations (optional).

### 2.3 Response Timeline
- **Initial Acknowledgment:** Within **24 hours**.
- **Assessment & Triage:** Within **72 hours**.
- **Patch & Coordinated Disclosure:** We aim to release a patched version within **14 business days** before publishing public advisories.

---

## 3. Scope & Safe Harbor

We consider security research conducted under this policy to be authorized. We will not pursue legal action against security researchers who:
- Make a good faith effort to avoid privacy violations, data destruction, and service interruption.
- Do not exploit vulnerabilities beyond the minimum necessary to verify their existence.
- Refrain from testing against active university student cohorts or live educational data.
- Provide reasonable time for us to remediate the vulnerability before public disclosure.
