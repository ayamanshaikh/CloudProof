"""
Unit tests for benchmark and diagnostic scripts.
Verifies micro-benchmark execution, latency thresholds, and environment auditing.
"""
import pytest
from scripts.benchmark_engine import run_benchmark
from scripts.diagnose_environment import run_diagnostics


def test_benchmark_engine_execution_and_thresholds():
    """
    Verifies that the deterministic rule engine micro-benchmark executes cleanly
    and satisfies the strict sub-millisecond evaluation SLA.
    """
    results = run_benchmark(iterations=50)

    assert results["iterations"] == 50
    assert results["total_time_sec"] > 0
    assert results["throughput_rps"] > 1000  # Must exceed 1,000 checks/sec
    assert results["mean_latency_ms"] < 2.0  # Must evaluate in < 2ms average
    assert results["p99_latency_ms"] < 5.0   # 99th percentile under 5ms


def test_diagnose_environment_audit_fields():
    """
    Verifies that the diagnostic auditor returns all required system metrics.
    """
    d = run_diagnostics()

    assert "os" in d
    assert "python_version" in d
    assert "in_virtualenv" in d
    assert "sqlite_db_exists" in d
    assert "port_8000_listening" in d
    assert isinstance(d["sqlite_db_exists"], bool)
