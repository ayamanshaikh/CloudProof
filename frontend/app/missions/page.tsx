import React from "react";
import Link from "next/link";
import { ShieldCheck, Database, Network, Key, ArrowRight, Clock, Award } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function MissionsCataloguePage() {
  const missions = [
    {
      id: "s3-leaky-bucket",
      title: "The Leaky Bucket",
      category: "Storage Security",
      service: "Amazon S3",
      difficulty: "Beginner",
      estimatedTime: "15 min",
      icon: Database,
      points: 100,
      description:
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
      points: 100,
      description:
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
      points: 100,
      description:
        "An application execution role carries overly broad administrative permissions. Detect the wildcard Action policy and replace it with a least-privilege configuration tailored to the workload.",
      skills: ["IAM Policy Syntax", "Action & Resource", "Least Privilege"],
    },
  ];

  return (
    <div className="min-h-screen flex flex-col justify-between bg-canvas transition-colors">
      <Navbar />

      <main className="max-w-6xl mx-auto px-6 py-14 flex-1 w-full">
        <div className="mb-10">
          <div className="inline-flex items-center space-x-1.5 text-xs font-semibold uppercase tracking-wider text-primary bg-primary/10 px-3 py-1 rounded-md mb-2">
            <span>Mission Catalogue</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-text-main tracking-tight">
            Interactive Cloud Missions
          </h1>
          <p className="mt-2 text-text-muted text-sm sm:text-base max-w-2xl leading-relaxed">
            Choose an incident scenario below to enter the interactive workbench. Troubleshoot configuration flaws, apply your fix, and receive automated deterministic verification.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {missions.map((m) => {
            const Icon = m.icon;
            return (
              <div
                key={m.id}
                className="bg-surface border border-border-subtle rounded-2xl p-7 shadow-sm hover:shadow-md transition flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-surface-secondary text-text-main border border-border-subtle">
                      {m.service}
                    </span>
                    <span className="text-xs text-text-muted flex items-center space-x-1">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{m.estimatedTime}</span>
                    </span>
                  </div>

                  <div className="flex items-center space-x-3 mb-3">
                    <div className="p-2.5 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="text-xs font-medium text-text-muted block">
                        {m.category}
                      </span>
                      <h2 className="text-lg font-bold text-text-main">
                        {m.title}
                      </h2>
                    </div>
                  </div>

                  <p className="text-sm text-text-muted leading-relaxed mb-6">
                    {m.description}
                  </p>

                  <div className="flex flex-wrap gap-1.5 mb-6">
                    {m.skills.map((skill) => (
                      <span
                        key={skill}
                        className="text-[11px] px-2 py-0.5 rounded bg-surface-secondary text-text-muted font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-border-subtle flex items-center justify-between gap-3">
                  <div className="flex items-center space-x-1 text-xs font-semibold text-text-muted">
                    <Award className="h-4 w-4 text-accent" />
                    <span>{m.points} pts</span>
                  </div>

                  <Link
                    href={`/missions/${m.id}`}
                    className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white font-semibold text-xs shadow-sm transition"
                  >
                    <span>Start Mission</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      <Footer />
    </div>
  );
}
