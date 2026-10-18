import React from "react";
import Link from "next/link";
import {
  Search,
  Wrench,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Terminal,
  BookOpen,
  Award,
  Zap,
  Cpu,
  Layers,
  Database,
  Network,
  Key,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function HowItWorksPage() {
  const pedagogicalStages = [
    {
      number: "01",
      badge: "Discover",
      title: "Inherit a Realistic Cloud Environment",
      desc: "Step into an active, simulated production architecture containing a subtle but dangerous security misconfiguration. No AWS account or credentials required.",
      example: "Fintech invoice bucket with unauthenticated public read access enabled.",
      icon: Search,
    },
    {
      number: "02",
      badge: "Investigate",
      title: "Inspect Telemetry & Cloud Alerts",
      desc: "Analyze simulated AWS CloudTrail logs, VPC Flow Logs, and AWS Security Hub alerts to understand how external scanners and botnets discover the vulnerability.",
      example: "Inspect curl GET requests downloading customer invoice PDFs in real time.",
      icon: Terminal,
    },
    {
      number: "03",
      badge: "Fix",
      title: "Apply Surgical Remediations",
      desc: "Use authentic cloud configurators to remediate the vulnerability. Toggle defense-in-depth switches, restrict CIDR firewall rules, or author least-privilege IAM policies.",
      example: "Enable all 4 S3 Block Public Access switches and set bucket ACL to private.",
      icon: Wrench,
    },
    {
      number: "04",
      badge: "Verify",
      title: "Deterministic Rule Verification",
      desc: "Run programmatic rule checks evaluated instantly on your machine. Receive an objective score out of 100, itemized pass/fail results, and concrete evidence quotes.",
      example: "Rule engine verifies S3 BPA (35 pts), Bucket Policy (35 pts), and ACL (30 pts).",
      icon: CheckCircle2,
    },
    {
      number: "05",
      badge: "Understand",
      title: "Pedagogical Post-Mortem & CLI Translation",
      desc: "Review plain-language explanations of why the fix works, examine the equivalent AWS CLI production commands, and study alignment with the AWS Well-Architected Framework.",
      example: "Learn how Service Control Policies (SCPs) prevent S3 leaks organization-wide.",
      icon: BookOpen,
    },
  ];

  const comparativeFeatures = [
    {
      criterion: "Learning Modality",
      traditional: "Passive multiple-choice memorization (A, B, C, D)",
      cloudproof: "Active hands-on problem solving in simulated cloud consoles",
    },
    {
      criterion: "Feedback Speed",
      traditional: "Delayed exam scores days or weeks later",
      cloudproof: "Instant sub-millisecond programmatic verification",
    },
    {
      criterion: "Grading Reliability",
      traditional: "Rigid answer keys or unpredictable generative AI grading",
      cloudproof: "100% deterministic, reproducible programmatic invariants",
    },
    {
      criterion: "Cloud Account Costs",
      traditional: "Risky live AWS accounts with surprise billing risks",
      cloudproof: "Zero cloud charges, zero credentials, 100% offline capable",
    },
    {
      criterion: "Real-World Application",
      traditional: "Theoretical knowledge often forgotten after the exam",
      cloudproof: "Muscle memory translating directly to production AWS CLI commands",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col justify-between bg-canvas transition-colors">
      <Navbar />

      <main className="max-w-5xl mx-auto px-6 py-16 flex-1 w-full">
        {/* Page Hero */}
        <div className="text-center mb-16">
          <span className="text-xs font-semibold uppercase tracking-wider text-primary bg-primary/10 px-3 py-1 rounded-md">
            Pedagogical Methodology
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-text-main tracking-tight mt-3">
            How CloudProof Teaches Cloud Computing
          </h1>
          <p className="mt-4 text-base sm:text-lg text-text-muted max-w-2xl mx-auto leading-relaxed">
            CloudProof turns common cloud configuration mistakes into interactive learning missions through a proven 5-stage loop:
            <span className="font-extrabold text-text-main block mt-1.5 text-primary">
              Discover &bull; Investigate &bull; Fix &bull; Verify &bull; Understand
            </span>
          </p>
        </div>

        {/* 5-Stage Experiential Learning Loop */}
        <div className="mb-20">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-text-main">
              The 5-Stage Learning Loop
            </h2>
            <p className="text-xs sm:text-sm text-text-muted mt-1">
              Every CloudProof mission guides the student through authentic SecOps troubleshooting.
            </p>
          </div>

          <div className="space-y-6">
            {pedagogicalStages.map((stage) => {
              const Icon = stage.icon;
              return (
                <div
                  key={stage.number}
                  className="bg-surface border border-border-subtle rounded-2xl p-7 shadow-sm transition flex flex-col md:flex-row items-start gap-6 hover:shadow-md"
                >
                  <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
                    {stage.number}
                  </div>

                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-primary/10 text-primary">
                        Stage {stage.number}: {stage.badge}
                      </span>
                      <h3 className="text-lg font-bold text-text-main">
                        {stage.title}
                      </h3>
                    </div>

                    <p className="text-text-muted text-xs sm:text-sm leading-relaxed mb-3">
                      {stage.desc}
                    </p>

                    <div className="p-3 rounded-xl bg-canvas border border-border-subtle flex items-center space-x-2 text-xs">
                      <span className="font-bold text-primary shrink-0">Example:</span>
                      <span className="text-text-muted font-mono text-[11px]">
                        {stage.example}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Comparative Analysis: Traditional vs CloudProof */}
        <div className="mb-20">
          <div className="text-center mb-10">
            <span className="text-xs font-semibold uppercase tracking-wider text-accent bg-accent/10 border border-accent/20 px-3 py-1 rounded-md">
              Higher Education Impact
            </span>
            <h2 className="text-2xl font-bold text-text-main mt-2">
              Traditional Cloud Exams vs. The CloudProof Method
            </h2>
            <p className="text-xs sm:text-sm text-text-muted mt-1 max-w-xl mx-auto">
              Why active troubleshooting develops stronger engineering intuition than passive multiple-choice certification exams.
            </p>
          </div>

          <div className="bg-surface border border-border-subtle rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border-subtle bg-surface-secondary/40 text-text-muted">
                    <th className="py-3.5 px-4 font-semibold">Evaluation Dimension</th>
                    <th className="py-3.5 px-4 font-semibold text-danger">Traditional Cloud Exams</th>
                    <th className="py-3.5 px-4 font-semibold text-success">CloudProof Interactive Labs</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {comparativeFeatures.map((row, idx) => (
                    <tr key={idx} className="hover:bg-surface-secondary/30 transition">
                      <td className="py-3.5 px-4 font-bold text-text-main">
                        {row.criterion}
                      </td>
                      <td className="py-3.5 px-4 text-text-muted">
                        {row.traditional}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-text-main">
                        <span className="text-success mr-1.5 font-bold">&check;</span>
                        {row.cloudproof}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Why Deterministic Invariants Matter */}
        <div className="bg-surface border border-border-subtle rounded-3xl p-8 sm:p-10 shadow-sm mb-16">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <Zap className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-text-main">
                Why 100% Deterministic Invariants Matter
              </h2>
              <span className="text-xs text-text-muted">
                Objective, reproducible, and verifiable grading for college accreditation.
              </span>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-text-muted leading-relaxed mb-6">
            Many modern educational prototypes rely on generative AI or LLMs to grade student code, resulting in unpredictable grades, prompt injection vulnerabilities, and expensive API latency. CloudProof intentionally executes a pure TypeScript invariant evaluation engine:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-canvas border border-border-subtle">
              <span className="font-bold text-text-main block mb-1">
                Zero AI Hallucinations
              </span>
              <p className="text-text-muted text-[11px] leading-relaxed">
                Rules are evaluated against formal cloud security invariants. Two students with identical fixes will always receive identical scores.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-canvas border border-border-subtle">
              <span className="font-bold text-text-main block mb-1">
                Sub-Millisecond Feedback
              </span>
              <p className="text-text-muted text-[11px] leading-relaxed">
                Verification checks run locally in the browser in under 15 milliseconds, maintaining focus without network lag or server timeouts.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-canvas border border-border-subtle">
              <span className="font-bold text-text-main block mb-1">
                Accreditation Ready
              </span>
              <p className="text-text-muted text-[11px] leading-relaxed">
                Itemized programmatic findings provide transparent grading criteria suitable for ABET and university course syllabus compliance.
              </p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center p-10 rounded-3xl bg-surface border border-border-subtle shadow-sm">
          <h2 className="text-2xl font-bold text-text-main mb-2">
            Experience the Educational Loop Yourself
          </h2>
          <p className="text-xs sm:text-sm text-text-muted max-w-md mx-auto mb-6">
            Choose any incident scenario in the catalogue to investigate a simulated cloud breach and test your remediation skills.
          </p>
          <Link
            href="/missions"
            className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl font-bold text-sm bg-primary hover:bg-primary-hover text-white shadow-sm transition"
          >
            <span>Explore All 3 Missions</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
