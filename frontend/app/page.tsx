import React from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Terminal,
  Database,
  Network,
  Key,
  ArrowRight,
  CheckCircle2,
  Lock,
  RotateCcw,
  BookOpen,
  Sparkles,
  Cloud,
  GraduationCap,
  Cpu,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function HomePage() {
  const featuredMissions = [
    {
      id: "s3-leaky-bucket",
      title: "The Leaky Bucket",
      category: "Storage Security",
      service: "Amazon S3",
      difficulty: "Beginner",
      estimatedTime: "15 min",
      icon: Database,
      scenario:
        "A startup accidentally configured its invoice storage so that customer data may be publicly readable. Investigate simulated S3 Block Public Access controls and secure it without breaking private access.",
      skills: ["S3 Block Public Access", "Bucket Policies", "Canned ACLs"],
    },
    {
      id: "sg-door-open",
      title: "Door Left Open",
      category: "Network Security",
      service: "VPC Security Groups",
      difficulty: "Intermediate",
      estimatedTime: "20 min",
      icon: Network,
      scenario:
        "A development environment inadvertently exposes administrative SSH (port 22) to the entire IPv4 internet (0.0.0.0/0). Investigate the inbound firewall rules and restrict access to authorized CIDR blocks.",
      skills: ["Security Group Rules", "CIDR Notation", "Stateful Ingress"],
    },
    {
      id: "iam-too-much-power",
      title: "Too Much Power",
      category: "Identity & Access",
      service: "AWS IAM",
      difficulty: "Intermediate",
      estimatedTime: "25 min",
      icon: Key,
      scenario:
        "An application execution role carries overly broad administrative permissions. Detect the wildcard Action policy and replace it with a least-privilege configuration tailored to the workload.",
      skills: ["IAM Policy Syntax", "Action & Resource", "Least Privilege"],
    },
  ];

  const steps = [
    {
      number: "1",
      title: "Investigate the Incident",
      desc: "Inherit a simulated live cloud configuration with an active flaw. Inspect cloud resource attributes, security controls, and access policies.",
      icon: Terminal,
    },
    {
      number: "2",
      title: "Apply a Corrective Action",
      desc: "Use realistic configuration controls to remediate the vulnerability. Toggle defense flags, adjust network rules, or scope IAM policies.",
      icon: Lock,
    },
    {
      number: "3",
      title: "Verify & Understand",
      desc: "Run programmatic rule checks with instant feedback. Receive an objective score and a clear, beginner-friendly explanation of why the fix works.",
      icon: CheckCircle2,
    },
  ];

  const valueProps = [
    {
      title: "Hands-on Learning",
      desc: "Active problem-solving replaces passive multiple-choice questions. Learn by troubleshooting real failure modes.",
      icon: Terminal,
    },
    {
      title: "Immediate Feedback",
      desc: "Instant verification checks evaluate your changes against programmatic security invariants in milliseconds.",
      icon: CheckCircle2,
    },
    {
      title: "Clear Explanations",
      desc: "Every check includes pedagogical security debriefs explaining the architectural mechanics and industry best practices.",
      icon: BookOpen,
    },
    {
      title: "Repeatable Practice",
      desc: "Reset and replay scenarios as many times as you need to explore alternative configurations and build diagnostic intuition.",
      icon: RotateCcw,
    },
    {
      title: "Zero AWS Costs Required",
      desc: "All missions run inside a high-fidelity local simulation engine. No credit cards, cloud accounts, or surprises.",
      icon: ShieldCheck,
    },
  ];

  const futureVision = [
    {
      title: "Real AWS Verification",
      badge: "Future Capability",
      desc: "Connect student AWS sandboxes via cross-account STS AssumeRole to audit actual live infrastructure.",
      icon: Cloud,
    },
    {
      title: "Instructor LMS Integration",
      badge: "Future Capability",
      desc: "LTI 1.3 automated gradebook sync with Canvas and Blackboard, plus class mistake analytics.",
      icon: GraduationCap,
    },
    {
      title: "Multi-Cloud Labs",
      badge: "Future Capability",
      desc: "Expand mission packs to Microsoft Azure (Blob Storage, NSGs) and Google Cloud Platform (IAM, Buckets).",
      icon: Cpu,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col justify-between bg-canvas transition-colors">
      <Navbar />

      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="max-w-6xl mx-auto px-6 pt-20 pb-24 text-center flex flex-col items-center">
          <div className="inline-flex items-center space-x-2 bg-primary/10 text-primary border border-primary/20 px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider mb-8">
            <ShieldCheck className="h-4 w-4" />
            <span>Interactive Cloud Security Lab</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-text-main tracking-tight max-w-4xl leading-[1.15]">
            Learn Cloud Computing by Fixing What Breaks.
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-text-muted max-w-2xl leading-relaxed">
            CloudProof turns cloud configuration mistakes into interactive learning missions.
            Investigate the problem, choose the right fix, and understand why it works.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center w-full sm:w-auto">
            <Link
              href="/missions"
              className="inline-flex items-center justify-center space-x-2 px-7 py-3.5 text-base font-semibold text-white bg-primary hover:bg-primary-hover rounded-xl shadow-md transition focus-visible:ring-2 focus-visible:ring-primary"
            >
              <span>Explore Missions</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/how-it-works"
              className="inline-flex items-center justify-center px-7 py-3.5 text-base font-semibold text-text-main bg-surface border border-border-subtle rounded-xl hover:bg-surface-secondary transition"
            >
              See How It Works
            </Link>
          </div>

          {/* Value Badges */}
          <div className="mt-14 pt-8 border-t border-border-subtle w-full max-w-3xl flex flex-wrap justify-center items-center gap-6 text-xs text-text-muted font-medium">
            <span className="flex items-center space-x-1.5">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <span>No AWS Account Required</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <span>Deterministic Automated Grading</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <span>Zero Runtime Remote APIs</span>
            </span>
          </div>
        </section>

        {/* HOW IT WORKS SECTION */}
        <section id="how-it-works" className="border-y border-border-subtle bg-surface transition-colors py-20 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="text-xs font-semibold uppercase tracking-wider text-primary bg-primary/10 px-3 py-1 rounded-md">
                The 3-Step Learning Loop
              </span>
              <h2 className="text-3xl font-bold text-text-main tracking-tight mt-3">
                How CloudProof Works
              </h2>
              <p className="mt-3 text-text-muted text-sm sm:text-base leading-relaxed">
                Step into the shoes of a cloud engineer. Follow a disciplined troubleshooting workflow from incident discovery to verified fix.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {steps.map((step) => {
                const Icon = step.icon;
                return (
                  <div
                    key={step.number}
                    className="p-8 rounded-2xl bg-canvas border border-border-subtle relative flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-6">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
                          <Icon className="h-6 w-6" />
                        </div>
                        <span className="text-3xl font-black text-text-muted/30">
                          0{step.number}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-text-main mb-2">
                        {step.title}
                      </h3>
                      <p className="text-sm text-text-muted leading-relaxed">
                        {step.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* FEATURED MISSIONS SECTION */}
        <section id="missions" className="max-w-6xl mx-auto px-6 py-20">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-primary bg-primary/10 px-3 py-1 rounded-md">
                Interactive Lab Catalogue
              </span>
              <h2 className="text-3xl font-bold text-text-main tracking-tight mt-3">
                Available Incident Missions
              </h2>
              <p className="mt-2 text-text-muted text-sm sm:text-base">
                Solve realistic configuration challenges across cloud storage, networking, and identity.
              </p>
            </div>
            <Link
              href="/missions"
              className="mt-4 md:mt-0 inline-flex items-center space-x-1.5 text-sm font-semibold text-primary hover:text-primary-hover transition"
            >
              <span>View all missions</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredMissions.map((mission) => {
              const Icon = mission.icon;
              return (
                <div
                  key={mission.id}
                  className="bg-surface border border-border-subtle rounded-2xl p-7 shadow-sm hover:shadow-md transition flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-surface-secondary text-text-main border border-border-subtle">
                        {mission.service}
                      </span>
                      <span className="text-xs font-medium text-text-muted">
                        {mission.estimatedTime}
                      </span>
                    </div>

                    <div className="flex items-center space-x-3 mb-3">
                      <div className="p-2.5 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <span className="text-xs font-medium text-text-muted block">
                          {mission.category}
                        </span>
                        <h3 className="text-lg font-bold text-text-main">
                          {mission.title}
                        </h3>
                      </div>
                    </div>

                    <p className="text-sm text-text-muted leading-relaxed mb-6">
                      {mission.scenario}
                    </p>

                    <div className="flex flex-wrap gap-1.5 mb-6">
                      {mission.skills.map((skill) => (
                        <span
                          key={skill}
                          className="text-[11px] px-2 py-0.5 rounded bg-surface-secondary text-text-muted font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  <Link
                    href={`/missions/${mission.id}`}
                    className="w-full inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white font-semibold text-sm shadow-sm transition"
                  >
                    <span>Start Mission</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              );
            })}
          </div>
        </section>

        {/* PRODUCT VALUE SECTION */}
        <section className="border-t border-border-subtle bg-surface transition-colors py-20 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="text-xs font-semibold uppercase tracking-wider text-primary bg-primary/10 px-3 py-1 rounded-md">
                Educational Advantage
              </span>
              <h2 className="text-3xl font-bold text-text-main tracking-tight mt-3">
                Why Practice With CloudProof?
              </h2>
              <p className="mt-3 text-text-muted text-sm sm:text-base leading-relaxed">
                Traditional cloud education often relies on passive slides or expensive cloud accounts. CloudProof provides a safe, guided flight simulator.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {valueProps.map((prop) => {
                const Icon = prop.icon;
                return (
                  <div
                    key={prop.title}
                    className="p-6 rounded-2xl bg-canvas border border-border-subtle flex flex-col justify-start"
                  >
                    <div className="p-2.5 rounded-xl bg-primary/10 text-primary w-fit mb-4">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="font-bold text-text-main text-base mb-1.5">
                      {prop.title}
                    </h3>
                    <p className="text-sm text-text-muted leading-relaxed">
                      {prop.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* FUTURE VISION SECTION */}
        <section id="future-vision" className="max-w-6xl mx-auto px-6 py-20">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-semibold uppercase tracking-wider text-accent bg-accent/10 border border-accent/20 px-3 py-1 rounded-md">
              Platform Roadmap
            </span>
            <h2 className="text-3xl font-bold text-text-main tracking-tight mt-3">
              The Future of CloudProof
            </h2>
            <p className="mt-3 text-text-muted text-sm sm:text-base leading-relaxed">
              This interactive demonstration showcases the core student learning mechanics. Here is how CloudProof expands into an institutional teaching suite.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {futureVision.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="bg-surface border border-border-subtle rounded-2xl p-7 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-accent/10 text-accent border border-accent/20">
                        {item.badge}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-text-main mb-2">
                      {item.title}
                    </h3>
                    <p className="text-sm text-text-muted leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* CTA Box */}
          <div className="rounded-3xl bg-surface border border-border-subtle p-8 md:p-12 text-center flex flex-col items-center">
            <h3 className="text-2xl md:text-3xl font-bold text-text-main tracking-tight">
              Ready to Test Your Cloud Security Skills?
            </h3>
            <p className="mt-3 text-text-muted text-sm sm:text-base max-w-xl leading-relaxed">
              No registration required. Choose an incident from the catalogue and begin troubleshooting immediately.
            </p>
            <Link
              href="/missions"
              className="mt-8 inline-flex items-center space-x-2 px-7 py-3.5 text-base font-semibold text-white bg-primary hover:bg-primary-hover rounded-xl shadow-md transition"
            >
              <span>Explore The Missions</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
