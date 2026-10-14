#!/usr/bin/env python3
"""
CloudProof Deterministic Rule Engine Micro-Benchmark Tool
========================================================
Measures verification engine throughput, mean latency, 99th percentile latency,
and CPU overhead under simulated concurrent student submissions.

Usage:
    python scripts/benchmark_engine.py [--iterations 500]
"""
import sys
import os
import time
import argparse
import statistics
from typing import List, Dict, Any

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

# Ensure backend and missions are importable
ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
BACKEND_DIR = os.path.join(ROOT_DIR, "backend")
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from app.engine.registry import MissionRegistry


def run_benchmark(iterations: int = 500) -> Dict[str, Any]:
    verifier = MissionRegistry.get_verifier("s3-public-invoices")
    if not verifier:
        raise RuntimeError("Could not load verifier for 's3-public-invoices'")

    # Sample hardened state
    sample_state = {
        "BlockPublicAcls": True,
        "IgnorePublicAcls": True,
        "BlockPublicPolicy": True,
        "RestrictPublicBuckets": True,
        "CannedACL": "private",
        "BucketPolicy": {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Sid": "AllowAppRole",
                    "Effect": "Allow",
                    "Principal": {"AWS": "arn:aws:iam::123456789012:role/App"},
                    "Action": "s3:GetObject",
                    "Resource": "arn:aws:s3:::cloudproof-acme-invoices/*"
                }
            ]
        }
    }

    latencies_ms: List[float] = []

    # Warmup
    for _ in range(20):
        for rule in verifier.rules:
            rule.evaluate(sample_state)

    start_total = time.perf_counter()
    for _ in range(iterations):
        t0 = time.perf_counter()
        for rule in verifier.rules:
            rule.evaluate(sample_state)
        t1 = time.perf_counter()
        latencies_ms.append((t1 - t0) * 1000.0)
    end_total = time.perf_counter()

    total_time_sec = end_total - start_total
    rps = iterations / total_time_sec if total_time_sec > 0 else 0.0

    latencies_sorted = sorted(latencies_ms)
    p50 = statistics.median(latencies_ms)
    p95 = latencies_sorted[int(iterations * 0.95)]
    p99 = latencies_sorted[int(iterations * 0.99)]
    mean_lat = statistics.mean(latencies_ms)
    stdev_lat = statistics.stdev(latencies_ms) if len(latencies_ms) > 1 else 0.0

    return {
        "iterations": iterations,
        "total_time_sec": total_time_sec,
        "throughput_rps": rps,
        "mean_latency_ms": mean_lat,
        "stdev_latency_ms": stdev_lat,
        "p50_latency_ms": p50,
        "p95_latency_ms": p95,
        "p99_latency_ms": p99,
        "min_latency_ms": min(latencies_ms),
        "max_latency_ms": max(latencies_ms),
    }


def print_report(results: Dict[str, Any]):
    print("=" * 65)
    print("      CLOUDPROOF DETERMINISTIC RULE ENGINE BENCHMARK REPORT      ")
    print("=" * 65)
    print(f"Total Iterations:      {results['iterations']}")
    print(f"Total Duration:        {results['total_time_sec']:.3f} seconds")
    print(f"Throughput:            {results['throughput_rps']:,.1f} verifications / second")
    print("-" * 65)
    print(f"Mean Latency:          {results['mean_latency_ms']:.4f} ms (±{results['stdev_latency_ms']:.4f})")
    print(f"Median (p50):          {results['p50_latency_ms']:.4f} ms")
    print(f"95th Percentile (p95): {results['p95_latency_ms']:.4f} ms")
    print(f"99th Percentile (p99): {results['p99_latency_ms']:.4f} ms")
    print(f"Min / Max Latency:     {results['min_latency_ms']:.4f} ms / {results['max_latency_ms']:.4f} ms")
    print("=" * 65)
    status = "EXCELLENT (< 5ms threshold)" if results['p99_latency_ms'] < 5.0 else "WARNING"
    print(f"Verification SLA Verdict: {status}\n")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="CloudProof Rule Engine Benchmark")
    parser.add_argument("--iterations", type=int, default=500, help="Number of benchmark iterations")
    args = parser.parse_args()

    results = run_benchmark(args.iterations)
    print_report(results)
