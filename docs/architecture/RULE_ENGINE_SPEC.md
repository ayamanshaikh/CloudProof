# Deterministic Rule Engine Specification & Authoring Guide

This specification defines how instructors and contributors author programmatic, deterministic verification rules for CloudProof.

---

## 1. Rule Architecture Anatomy

Every verification rule is implemented as a pure function inheriting from `BaseRule` or returning a `RuleEvaluationResult`.

```python
class BaseRule(ABC):
    rule_id: str          # Unique rule ID (e.g., 'CP-S3-001')
    name: str             # Human-readable rule title
    description: str      # Exact security invariant being validated
    points: int           # Maximum point value allocated to this check
    severity: str         # 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'

    @abstractmethod
    def evaluate(self, state: Dict[str, Any]) -> RuleEvaluationResult:
        """
        Pure function: Evaluates state and returns pass/fail with feedback.
        Must execute in < 5ms without network calls.
        """
        pass
```

---

## 2. Mandatory Rule Invariants

1. **Determinism:** Given the same input `state`, `evaluate()` must **always** return the exact same verdict and score.
2. **Side-Effect Free:** A rule must **never** mutate the incoming `state` dictionary or perform asynchronous I/O.
3. **Exploratory Feedback:** When a rule fails, `feedback` must explain *what* invariant failed without simply printing the answer key.
4. **Resilience to Malformed Input:** Rules must safely handle missing keys, null values, or unexpected types without raising unhandled exceptions.
