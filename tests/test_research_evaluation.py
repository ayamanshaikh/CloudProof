"""
Tests for Step 25: Research Evaluation & Statistical Analysis.
Verifies the mathematical rigor, inferential statistics calculations,
Student's t-test p-value approximation, Cohen's d effect sizes,
Hake's normalized gains, and LaTeX / Markdown artifact generation.
"""
import os
import json
import pytest
from scripts.research_statistical_analysis import (
    calculate_student_t_pvalue,
    compute_inferential_stats,
    perform_full_research_analysis,
    generate_markdown_summary,
    generate_latex_table,
    BENCHMARK_DATA,
)


def test_student_t_pvalue_accuracy():
    """
    Validates numerical integration of Student-t distribution against known statistical benchmarks.
    At df=18, critical t for alpha=0.05 two-tailed is approximately 2.1009.
    """
    p_val_05 = calculate_student_t_pvalue(2.1009, 18)
    assert 0.048 < p_val_05 < 0.052, f"Expected p ~ 0.05, got {p_val_05}"

    p_val_large = calculate_student_t_pvalue(10.0, 18)
    assert p_val_large < 0.0001, f"Expected p < 0.0001 for t=10.0, got {p_val_large}"

    p_val_zero = calculate_student_t_pvalue(0.0, 18)
    assert p_val_zero == 1.0


def test_inferential_statistics_calculation():
    """
    Validates calculations of two-sample means, pooled standard deviation,
    Cohen's d, standard error, and confidence intervals.
    """
    ctrl = [10.0, 12.0, 11.0, 13.0, 9.0]
    exp = [20.0, 22.0, 21.0, 23.0, 19.0]

    stats = compute_inferential_stats(ctrl, exp)

    assert stats["n_ctrl"] == 5
    assert stats["n_exp"] == 5
    assert stats["df"] == 8
    assert stats["mean_ctrl"] == 11.0
    assert stats["mean_exp"] == 21.0
    assert stats["diff"] == 10.0
    assert stats["cohens_d"] > 0
    assert stats["p_val"] < 0.001
    assert stats["ci_lower"] < stats["diff"] < stats["ci_upper"]


def test_rq1_to_rq4_research_hypotheses_benchmarks():
    """
    Validates that the empirical pilot dataset satisfies all 4 core research questions:
      RQ1: Resolution efficiency (time reduction p < 0.0001, d < -2.0)
      RQ2: AI ground-truth alignment is 100% and scoring hallucination rate is 0.0%
      RQ3: Conceptual gain is significantly superior (Hake g in high-gain tier > 0.70)
      RQ4: Zero student infrastructure cost ($0.00)
    """
    results = perform_full_research_analysis(BENCHMARK_DATA)

    # RQ1: Time-to-solve efficiency
    time_stats = results["time_min"]
    assert time_stats["mean_exp"] < time_stats["mean_ctrl"]
    assert time_stats["p_val"] < 0.0001
    assert time_stats["cohens_d"] < -2.0  # Massive reduction in time to solve

    # RQ2: AI ground-truth alignment and separation
    audit = results["ai_and_cost_audit"]
    assert audit["verdict_rule_alignment_rate"] == 100.0
    assert audit["scoring_hallucination_rate"] == 0.0

    # RQ3: Conceptual gain & Hake's normalized gain
    hake_stats = results["normalized_gain_g"]
    assert hake_stats["mean_exp"] >= 0.70  # Experimental cohort is in High-Gain tier (g >= 0.70)
    assert hake_stats["mean_ctrl"] < 0.50  # Control cohort is in Medium-Gain tier
    assert hake_stats["p_val"] < 0.0001
    assert hake_stats["cohens_d"] > 2.0

    # RQ4: Cost safety
    assert audit["mode_a_cloud_cost_usd"] == 0.00
    assert audit["mode_b_zombie_resources"] == 0


def test_markdown_and_latex_artifact_generation():
    """
    Validates that formatted Markdown and LaTeX tables are properly constructed
    with all required columns, symbols, and formatting tags.
    """
    results = perform_full_research_analysis(BENCHMARK_DATA)
    md = generate_markdown_summary(results)
    latex = generate_latex_table(results)

    # Markdown verification
    assert "### Empirical Pilot Study: Primary Outcome Variables (N=20)" in md
    assert "Time to Solve (min)" in md
    assert "Cohen's d" in md
    assert "100.0%" in md
    assert "$0.00" in md

    # LaTeX verification
    assert r"\begin{table*}" in latex
    assert r"\caption{Empirical Comparison between Traditional Static Instruction and CloudProof" in latex
    assert r"\toprule" in latex
    assert r"\bottomrule" in latex
    assert r"\end{table*}" in latex
