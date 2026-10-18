import React from "react";
import Link from "next/link";
import {
  Cloud,
  GraduationCap,
  Cpu,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Server,
  Layers,
  Lock,
  ExternalLink,
  Code2,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function FutureVisionPage() {
  const roadmapPhases = [
    {
      phase: "Phase I",
      status: "Current Deliverable (Verified MVP)",
      title: "Interactive Flight Simulator",
      desc: "The current standalone browser application demonstrating the core educational loop with 100% deterministic local simulation and zero cloud setup requirements.",
      highlights: [
        "100% client-side deterministic invariant engine in pure TypeScript",
        "3 interactive incident missions: S3 Storage, VPC Security Groups, AWS IAM",
        "Authentic telemetry logs (CloudTrail, VPC Flow Logs, Security Hub)",
        "Live copyable AWS CLI command equivalence generator",
        "Printable student evaluation certificate and report card",
        "Zero AWS accounts, zero credentials, zero remote API costs",
      ],
      badgeColor: "bg-success/10 text-success border-success/30",
    },
    {
      phase: "Phase II",
      status: "Future Capability",
      title: "Live Cloud Infrastructure Auditing",
      desc: "Connect student cloud sandboxes to audit real, active cloud infrastructure without requiring students to share long-lived credentials.",
      highlights: [
        "Ephemeral cross-account AWS STS AssumeRole with ExternalId verification",
        "Automated Terraform & CloudFormation sandbox deployment templates",
        "Live drift detection comparing student AWS API responses against security policies",
        "Zero static AWS access keys or secret keys stored on platform servers",
        "Automated teardown and budget kill-switches to prevent runaway cloud costs",
      ],
      badgeColor: "bg-primary/10 text-primary border-primary/30",
    },
    {
      phase: "Phase III",
      status: "Future Capability",
      title: "University Ecosystem & LMS Integration",
      desc: "Seamless higher-education deployment with automated gradebook synchronization and class-wide mistake analytics.",
      highlights: [
        "LTI 1.3 standards-compliant grade sync with Canvas, Blackboard, and Moodle",
        "Instructor dashboard displaying common student mistake heatmaps",
        "Multi-cloud expansion to Microsoft Azure (NSGs, Blobs) and GCP (IAM, Storage)",
        "Advanced Linux kernel and container security labs (eBPF, Kubernetes policies)",
        "RFC 4180 CSV grade export for university ABET accreditation reviews",
      ],
      badgeColor: "bg-accent/10 text-accent border-accent/30",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col justify-between bg-canvas transition-colors">
      <Navbar />

      <main className="max-w-5xl mx-auto px-6 py-16 flex-1 w-full">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="text-xs font-semibold uppercase tracking-wider text-accent bg-accent/10 border border-accent/20 px-3 py-1 rounded-md">
            Product Roadmap & Expansion
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-text-main tracking-tight mt-3">
            The Future Vision of CloudProof
          </h1>
          <p className="mt-4 text-base sm:text-lg text-text-muted max-w-2xl mx-auto leading-relaxed">
            From an interactive browser-based flight simulator to an enterprise higher-education cloud verification platform. Here is the architectural expansion path.
          </p>
        </div>

        {/* 3-Phase Roadmap */}
        <div className="space-y-8 mb-16">
          {roadmapPhases.map((phase) => (
            <div
              key={phase.phase}
              className="bg-surface border border-border-subtle rounded-3xl p-8 sm:p-10 shadow-sm transition hover:shadow-md"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border-subtle mb-5">
                <div className="flex items-center space-x-3">
                  <span className="text-xs font-mono font-bold uppercase tracking-widest text-text-muted">
                    {phase.phase}
                  </span>
                  <span
                    className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${phase.badgeColor}`}
                  >
                    {phase.status}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-text-main">
                  {phase.title}
                </h2>
              </div>

              <p className="text-text-muted text-xs sm:text-sm leading-relaxed mb-6">
                {phase.desc}
              </p>

              <div className="bg-canvas border border-border-subtle rounded-2xl p-5">
                <span className="text-xs font-bold uppercase tracking-wider text-text-main block mb-3">
                  Key Architectural Capabilities:
                </span>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs text-text-muted">
                  {phase.highlights.map((h, idx) => (
                    <li key={idx} className="flex items-start space-x-2">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{h}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* Technical Architecture Deep-Dive: STS Cross-Account Blueprint */}
        <div className="bg-surface border border-border-subtle rounded-3xl p-8 sm:p-10 shadow-sm mb-16">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <Cloud className="h-6 w-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-accent/10 text-accent">
                Future Architecture Blueprint
              </span>
              <h3 className="text-xl font-bold text-text-main mt-0.5">
                Phase II: Cross-Account STS AssumeRole Protocol
              </h3>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-text-muted leading-relaxed mb-6">
            In future commercial deployments with student AWS accounts, CloudProof will never ask for AWS access keys or secret credentials. Instead, it leverages ephemeral AWS Security Token Service (STS) cross-account assume-role delegation:
          </p>

          <div className="p-5 rounded-2xl bg-canvas border border-border-subtle font-mono text-xs text-text-main space-y-2 overflow-x-auto leading-relaxed">
            <div className="text-text-muted"># 1. Student deploys read-only CloudFormation template in their AWS sandbox:</div>
            <div className="text-primary">RoleArn: arn:aws:iam::student-account-id:role/CloudProofVerificationRole</div>
            <div className="text-text-muted"># 2. Platform verifies configuration using temporary 15-minute STS session tokens:</div>
            <div className="text-text-main">aws sts assume-role --role-arn &quot;arn:aws:iam:...&quot; --role-session-name &quot;LabAudit&quot; --external-id &quot;uni-cs440-student42&quot;</div>
            <div className="text-text-muted"># 3. Read-only verification engine audits live resources & auto-destroys tokens.</div>
          </div>
        </div>

        {/* Higher Education LMS Integration Blueprint */}
        <div className="bg-surface border border-border-subtle rounded-3xl p-8 sm:p-10 shadow-sm mb-16">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-accent/10 text-accent">
                Future Architecture Blueprint
              </span>
              <h3 className="text-xl font-bold text-text-main mt-0.5">
                Phase III: University LMS LTI 1.3 Sync & Class Analytics
              </h3>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-text-muted leading-relaxed mb-6">
            CloudProof is designed to seamlessly integrate into academic syllabi as an automated lab assignment engine.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-canvas border border-border-subtle">
              <span className="font-bold text-text-main block mb-1">
                LTI 1.3 Grade Passback
              </span>
              <p className="text-text-muted text-[11px] leading-relaxed">
                Scores verified by the deterministic engine automatically push into Canvas, Blackboard, and Moodle gradebooks without manual instructor entry.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-canvas border border-border-subtle">
              <span className="font-bold text-text-main block mb-1">
                Classroom Mistake Heatmaps
              </span>
              <p className="text-text-muted text-[11px] leading-relaxed">
                Professors can see aggregate analytics showing that 68% of students missed S3 `IgnorePublicAcls`, allowing targeted lecture reviews.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-canvas border border-border-subtle">
              <span className="font-bold text-text-main block mb-1">
                Multi-Cloud Lab Expansion
              </span>
              <p className="text-text-muted text-[11px] leading-relaxed">
                Extending declarative rule definitions to Microsoft Azure Blob Storage / NSGs and Google Cloud Platform VPC firewall rules.
              </p>
            </div>
          </div>
        </div>

        {/* Current MVP Boundary Disclosure Card */}
        <div className="p-8 rounded-3xl bg-surface border border-border-subtle text-center max-w-2xl mx-auto shadow-sm">
          <div className="inline-flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">
            <ShieldCheck className="h-4 w-4 text-success" />
            <span>Strict Prototype Boundaries</span>
          </div>
          <h4 className="text-lg font-bold text-text-main mb-2">
            Fully Functional Standalone MVP
          </h4>
          <p className="text-xs sm:text-sm text-text-muted leading-relaxed mb-6">
            The current demonstration runs entirely in your browser without any external API calls, remote databases, or cloud accounts. All interactive missions, deterministic rule evaluations, and report cards are 100% operational offline.
          </p>
          <Link
            href="/missions"
            className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-xl font-bold text-xs bg-primary hover:bg-primary-hover text-white shadow-sm transition"
          >
            <span>Launch Mission Simulator</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
