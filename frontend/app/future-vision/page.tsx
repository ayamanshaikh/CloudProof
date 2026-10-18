import React from "react";
import Link from "next/link";
import { Cloud, GraduationCap, Cpu, ShieldCheck, CheckCircle2, ArrowRight } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function FutureVisionPage() {
  const visionItems = [
    {
      title: "Real AWS Infrastructure Verification",
      badge: "Future Capability",
      desc: "Beyond in-memory simulation: connect student AWS sandbox environments via least-privilege cross-account STS AssumeRole to audit actual live S3 buckets, security groups, and IAM policies.",
      icon: Cloud,
      details: [
        "Ephemeral, short-lived STS credentials with ExternalId validation",
        "Zero static AWS access keys stored on platform servers",
        "CloudFormation & Terraform sandbox provisioning templates",
      ],
    },
    {
      title: "Instructor LMS Integration (Canvas / Blackboard)",
      badge: "Future Capability",
      desc: "Seamless higher-education deployment with LTI 1.3 standards-compliant grade passback, automated classroom roster synchronization, assignment scheduling, and class mistake analytics.",
      icon: GraduationCap,
      details: [
        "Automatic grade sync to university LMS gradebooks",
        "Roster-wide mistake matrix identifying common student pitfalls",
        "One-click RFC 4180 compliant CSV exports for accreditation audits",
      ],
    },
    {
      title: "Multi-Cloud Curriculum (Azure & Google Cloud)",
      badge: "Future Capability",
      desc: "Expanding declarative incident packs to Microsoft Azure (Blob Storage access tiers, Network Security Groups, RBAC) and Google Cloud Platform (IAM conditions, Cloud Storage uniform bucket-level access).",
      icon: Cpu,
      details: [
        "Consistent multi-cloud policy evaluation semantics",
        "Curated scenarios modeling real enterprise multi-cloud incidents",
        "Platform-agnostic diagnostic problem-solving skills",
      ],
    },
  ];

  return (
    <div className="min-h-screen flex flex-col justify-between bg-canvas transition-colors">
      <Navbar />

      <main className="max-w-5xl mx-auto px-6 py-16 flex-1 w-full">
        <div className="text-center mb-16">
          <span className="text-xs font-semibold uppercase tracking-wider text-accent bg-accent/10 border border-accent/20 px-3 py-1 rounded-md">
            Product Roadmap & Expansion
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-text-main tracking-tight mt-3">
            The Future Vision of CloudProof
          </h1>
          <p className="mt-4 text-base sm:text-lg text-text-muted max-w-2xl mx-auto leading-relaxed">
            This interactive demo represents the foundational student flight simulator.
            Here is the architectural roadmap designed for university-wide adoption.
          </p>
        </div>

        <div className="space-y-8 mb-14">
          {visionItems.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="bg-surface border border-border-subtle rounded-2xl p-8 shadow-sm flex flex-col md:flex-row items-start gap-6"
              >
                <div className="p-3.5 rounded-2xl bg-primary/10 text-primary flex-shrink-0">
                  <Icon className="h-7 w-7" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h2 className="text-xl font-bold text-text-main">{item.title}</h2>
                    <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20">
                      {item.badge}
                    </span>
                  </div>
                  <p className="text-text-muted text-sm leading-relaxed mb-4">
                    {item.desc}
                  </p>
                  <ul className="space-y-1.5 text-xs text-text-main">
                    {item.details.map((d, idx) => (
                      <li key={idx} className="flex items-center space-x-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                        <span>{d}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>

        {/* Current MVP Boundary Disclosure Card */}
        <div className="p-8 rounded-2xl bg-surface border border-border-subtle text-center max-w-2xl mx-auto shadow-sm">
          <div className="inline-flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">
            <ShieldCheck className="h-4 w-4 text-success" />
            <span>Demo Simulation Boundary</span>
          </div>
          <h3 className="text-lg font-bold text-text-main mb-2">
            100% Client-Side Deterministic Engine
          </h3>
          <p className="text-text-muted text-xs sm:text-sm leading-relaxed mb-6">
            All missions in this current build execute locally in your browser. No live cloud accounts are required, no external AI APIs are invoked at runtime, and no student cloud bills will ever be incurred.
          </p>
          <Link
            href="/missions"
            className="inline-flex items-center space-x-2 px-6 py-2.5 bg-primary hover:bg-primary-hover text-white text-sm font-semibold rounded-lg shadow-sm transition"
          >
            <span>Explore The Current Missions</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
