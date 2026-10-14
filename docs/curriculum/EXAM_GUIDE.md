# Instructor Practical Exam Administration Guide

This guide describes how to administer timed, hands-on midterm and final practical exams using CloudProof.

---

## 1. Exam Configuration Recommendations

When administering a timed examination:
1. **Dedicated Exam Section:** Create a separate course section (e.g., `CS401-MIDTERM-F26`) with a distinct join code.
2. **Hint Token Budget:** Set the class daily virtual token allocation to `0` or disable hint unlocks to assess independent troubleshooting ability.
3. **Time Window:** Standard practical exams are typically allotted **75 minutes** for 2 combined incidents (e.g. S3 Public Invoices + Overprivileged Lambda Role).

---

## 2. Preventing Academic Dishonesty

- **Deterministic Audit Trail:** Every verification attempt logs exact timestamps, configuration diffs, and IP addresses.
- **AI Physical Separation:** The AI engine is decoupled from grading; students cannot prompt-inject or trick the grading engine into awarding points.
- **De-Identified Export:** Anonymized research export (`GET /instructor/classes/{id}/research/export`) can be archived for accreditation audits (ABET / NSA CAE).
