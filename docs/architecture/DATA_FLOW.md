# CloudProof Data Flow & Verification Pipeline Specification

This document details the step-by-step data lifecycle during an automated mission verification cycle in both Simulation Mode (Mode A) and Real AWS Mode (Mode B).

---

## 1. End-to-End Verification Pipeline

```mermaid
sequenceDiagram
    autonumber
    actor Student
    participant Frontend as Next.js Web App
    participant API as FastAPI Gateway
    participant RateLimiter as RateLimitMiddleware
    participant Engine as Deterministic Engine
    participant AWS as AWS STS / Boto3 (Mode B)
    participant DB as Database (SQLAlchemy)
    participant AI as Gemini 3.8 Flash / Offline LLM

    Student->>Frontend: Submits configuration / clicks 'Verify Fix'
    Frontend->>API: POST /api/v1/missions/{attempt_id}/verify
    API->>RateLimiter: Check IP token bucket (< 20 req/min)
    RateLimiter-->>API: Allow Request
    API->>Engine: Evaluate submission against mission rule pack

    alt Mode A: Simulation
        Engine->>Engine: Parse simulated JSON payload & state
    else Mode B: Real AWS
        Engine->>AWS: AssumeRole(RoleArn, ExternalId)
        AWS-->>Engine: Temporary STS Credentials
        Engine->>AWS: Boto3 client inspection (e.g. get_public_access_block)
        AWS-->>Engine: Live AWS Resource State
    end

    Engine->>Engine: Execute programmatic rule invariants
    Engine-->>API: RuleResults (PASSED/FAILED, Points Earned)
    API->>DB: Persist AttemptStatus & Score update
    
    opt Asynchronous / Deferred AI Post-Mortem
        API->>AI: generate_post_mortem(rule_results, diff, threat_context)
        AI-->>API: Grounded 6-Part Markdown Debrief
        API->>DB: Store PostMortem entity
    end

    API-->>Frontend: Return VerificationResponse
    Frontend-->>Student: Display pass/fail badges, points, and AI post-mortem tab
```

---

## 2. Invariant Normalization Layer

To ensure identical deterministic behavior across Mode A and Mode B:

1. **State Normalizer:** The Boto3 adapter converts AWS API responses into normalized Python dictionaries matching the simulation payload structure.
2. **Boolean Strictness:** S3 BPA flags (`BlockPublicAcls`, `IgnorePublicAcls`, etc.) are coerced to strict Python booleans (`bool`), rejecting string representations like `"true"` or `"1"`.
3. **JSON Policy Canonicalization:** IAM and S3 bucket policies are parsed into canonical AST dictionaries, sorted by `Sid`, with single-element arrays normalized to lists to prevent false negatives.
