## Description

Please include a summary of the changes and the related issue.

Fixes #(issue)

## Architectural Compliance Checklist

- [ ] **AI Separation Rule**: Does NOT use AI for grading, scoring, or pass/fail verdicts.
- [ ] **Dual-Mode Compatible**: Tested in local simulation mode (zero cloud cost).
- [ ] **Automated Tests**: Included unit and/or integration tests with `pytest`.
- [ ] **Type Safety**: Frontend passes `npm run typecheck` with zero errors.
- [ ] **Security**: No hardcoded API keys, static AWS credentials, or secrets.

## Testing Instructions

1. `pytest tests/ -v`
2. `cd frontend && npm run typecheck`
3. Manual verification steps:
