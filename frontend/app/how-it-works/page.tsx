import React from "react";
import Link from "next/link";
import { Search, Wrench, CheckCircle2, ArrowRight, ShieldCheck, Terminal, BookOpen } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function HowItWorksPage() {
  const steps = [
    {
      number: "01",
      title: "Investigate a Cloud Incident",
      desc: "Step into an active misconfiguration. Inspect realistic cloud resource controls, storage bucket access blocks, security group firewall tables, or IAM policy statements. Identify the vulnerability without risking actual infrastructure.",
      icon: Search,
      takeaways: [
        "Analyze real-world simulated configurations",
        "Observe the exact vulnerability vector",
        "Formulate a diagnostic hypothesis",
      ],
    },
    {
      number: "02",
      title: "Choose & Apply a Corrective Action",
      desc: "Apply surgical configuration updates using interactive controls. Toggle security defenses, restrict CIDR IP boundaries, or scope down overly broad administrative wildcard policies to least-privilege.",
      icon: Wrench,
      takeaways: [
        "Interactive controls reflect real cloud settings",
        "Learn why partial fixes often fail",
        "Practice safe configuration ergonomics",
      ],
    },
    {
      number: "03",
      title: "Verify the Fix & Understand the Mechanics",
      desc: "Trigger deterministic programmatic verification rules. Receive an objective score out of 100, itemized pass/fail results with concrete evidence, and beginner-friendly architectural post-mortems.",
      icon: CheckCircle2,
      takeaways: [
        "Zero AI hallucinations in grading verdicts",
        "Sub-millisecond verification feedback",
        "Clear explanations of underlying security concepts",
      ],
    },
  ];

  return (
    <div className="min-h-screen flex flex-col justify-between bg-canvas transition-colors">
      <Navbar />

      <main className="max-w-4xl mx-auto px-6 py-16 flex-1 w-full">
        <div className="text-center mb-16">
          <span className="text-xs font-semibold uppercase tracking-wider text-primary bg-primary/10 px-3 py-1 rounded-md">
            Pedagogical Methodology
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-text-main tracking-tight mt-3">
            How CloudProof Works
          </h1>
          <p className="mt-4 text-base sm:text-lg text-text-muted max-w-2xl mx-auto leading-relaxed">
            CloudProof replaces passive multiple-choice quizzes with an experiential learning loop:
            <span className="font-semibold text-text-main block mt-1">
              Discover &rarr; Investigate &rarr; Fix &rarr; Verify &rarr; Understand
            </span>
          </p>
        </div>

        <div className="space-y-8">
          {steps.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.number}
                className="bg-surface border border-border-subtle rounded-2xl p-8 shadow-sm transition flex flex-col md:flex-row items-start gap-6"
              >
                <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xl">
                  {s.number}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2.5 mb-2">
                    <Icon className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-bold text-text-main">{s.title}</h2>
                  </div>
                  <p className="text-text-muted text-sm leading-relaxed mb-4">
                    {s.desc}
                  </p>
                  <div className="bg-canvas border border-border-subtle rounded-xl p-4">
                    <span className="text-xs font-semibold uppercase tracking-wider text-text-muted block mb-2">
                      Key Learning Objectives:
                    </span>
                    <ul className="space-y-1.5 text-xs text-text-main">
                      {s.takeaways.map((item, idx) => (
                        <li key={idx} className="flex items-center space-x-2">
                          <CheckCircle2 className="h-3.5 w-3.5 text-success flex-shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-14 text-center">
          <Link
            href="/missions"
            className="inline-flex items-center space-x-2 px-7 py-3.5 bg-primary hover:bg-primary-hover text-white font-semibold rounded-xl shadow-md transition"
          >
            <span>Launch an Interactive Mission</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
