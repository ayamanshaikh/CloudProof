"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  api,
  StudentPortfolioResponse,
  CompetencyScore,
  CompletedMissionRecord
} from "@/lib/api";
import {
  ShieldCheck,
  ArrowLeft,
  Award,
  CheckCircle2,
  Lock,
  ExternalLink,
  Printer,
  Copy,
  Check,
  Sparkles,
  Server,
  Layers,
  Clock,
  Key,
  Network
} from "lucide-react";

export default function StudentPortfolioPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [portfolio, setPortfolio] = useState<StudentPortfolioResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "student")) {
      router.push("/login");
      return;
    }

    if (user && user.role === "student") {
      fetchPortfolio();
    }
  }, [user, authLoading, router]);

  const fetchPortfolio = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await api.getStudentPortfolio();
      setPortfolio(data);
    } catch (err: any) {
      setError(err.message || "Failed to load skills portfolio.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyToken = () => {
    if (portfolio?.badge.verification_token) {
      navigator.clipboard.writeText(portfolio.badge.verification_token);
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-slate-600">Loading verified portfolio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col print:bg-white print:p-0">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-6 py-4 print:hidden">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link
              href="/student/dashboard"
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
              title="Return to Dashboard"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="bg-blue-600 text-white p-2 rounded-xl shadow-sm">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <span className="font-bold text-lg text-slate-900 tracking-tight">CloudProof</span>
              <span className="ml-2 text-xs font-semibold px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full">
                Verified Credentials
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold shadow-sm transition flex items-center space-x-1.5"
            >
              <Printer className="h-4 w-4" />
              <span>Print Attestation</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-8 space-y-8">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            {error}
          </div>
        )}

        {portfolio && (
          <>
            {/* Student Profile & Portfolio Banner */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center space-x-4">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-extrabold text-2xl flex items-center justify-center shadow-md">
                  {portfolio.full_name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h1 className="text-2xl font-bold text-slate-900">{portfolio.full_name}</h1>
                    <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[11px] font-bold">
                      Verified Practitioner
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{portfolio.email}</p>
                  <p className="text-xs text-slate-600 font-medium mt-1">
                    Student ID: <code className="font-mono text-slate-700">{portfolio.student_id}</code>
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-4 shrink-0 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="text-center px-3 border-r border-slate-200">
                  <span className="text-2xl font-black text-slate-900 block">
                    {portfolio.total_completed}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Incidents Solved
                  </span>
                </div>
                <div className="text-center px-3">
                  <span className="text-2xl font-black text-blue-600 block">
                    {Math.round(portfolio.overall_average_score)}%
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Average Score
                  </span>
                </div>
              </div>
            </div>

            {/* Credential Attestation Card */}
            <div
              className={`rounded-2xl border p-8 shadow-md relative overflow-hidden transition ${
                portfolio.badge.is_earned
                  ? "bg-slate-950 text-white border-slate-800"
                  : "bg-white text-slate-900 border-slate-200"
              }`}
            >
              {portfolio.badge.is_earned && (
                <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
              )}

              <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 relative z-10">
                <div>
                  <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-amber-500/20 to-blue-500/20 text-amber-300 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-3 border border-amber-500/30">
                    <Award className="h-4 w-4 text-amber-400" />
                    <span>Official Attestation of Competency</span>
                  </div>
                  <h2 className="text-2xl font-extrabold tracking-tight">
                    {portfolio.badge.title}
                  </h2>
                  <p className="text-xs text-slate-400 mt-2 max-w-2xl leading-relaxed">
                    This digital credential confirms that the candidate has autonomously investigated, remediated, and verified misconfigured cloud environments against deterministic automated rules across Amazon S3, AWS IAM, and Amazon VPC.
                  </p>

                  <div className="mt-6 flex flex-wrap gap-2">
                    {portfolio.badge.required_missions.map((req, i) => (
                      <span
                        key={i}
                        className={`text-xs px-2.5 py-1 rounded-lg font-semibold flex items-center space-x-1.5 ${
                          portfolio.badge.is_earned
                            ? "bg-slate-900 text-slate-200 border border-slate-800"
                            : "bg-slate-100 text-slate-700 border border-slate-200"
                        }`}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                        <span>{req}</span>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 min-w-[260px] shrink-0 text-left space-y-3">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
                      Status
                    </span>
                    <span
                      className={`text-sm font-bold block mt-0.5 ${
                        portfolio.badge.is_earned ? "text-emerald-400" : "text-amber-400"
                      }`}
                    >
                      {portfolio.badge.is_earned ? "VERIFIED & ISSUED" : "IN PROGRESS (3 REQUIRED)"}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
                      Verification Hash
                    </span>
                    <div className="flex items-center space-x-2 mt-0.5">
                      <code className="text-xs font-mono text-emerald-400 font-bold">
                        {portfolio.badge.verification_token}
                      </code>
                      {portfolio.badge.is_earned && (
                        <button
                          onClick={handleCopyToken}
                          className="p-1 text-slate-400 hover:text-white rounded transition"
                          title="Copy Token"
                        >
                          {copiedToken ? (
                            <Check className="h-3.5 w-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {portfolio.badge.earned_at && (
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
                        Issue Date
                      </span>
                      <span className="text-xs text-slate-300 font-medium block mt-0.5">
                        {new Date(portfolio.badge.earned_at).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-800">
                    <span className="text-[10px] text-slate-500 block">
                      Authority: {portfolio.badge.issuer}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Core Competencies Radar Section */}
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Layers className="h-5 w-5 text-blue-600" />
                <h2 className="text-lg font-bold text-slate-900">Security Competency Domains</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {portfolio.competencies.map((comp: CompetencyScore) => {
                  const isS3 = comp.domain === "Storage Security";
                  const isIam = comp.domain === "IAM & Privilege Escalation";
                  const isNet = comp.domain === "Network Security & VPC";

                  return (
                    <div
                      key={comp.domain}
                      className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <div
                            className={`p-2 rounded-lg ${
                              isS3
                                ? "bg-blue-50 text-blue-600"
                                : isIam
                                ? "bg-purple-50 text-purple-600"
                                : "bg-indigo-50 text-indigo-600"
                            }`}
                          >
                            {isS3 ? (
                              <Server className="h-5 w-5" />
                            ) : isIam ? (
                              <Key className="h-5 w-5" />
                            ) : (
                              <Network className="h-5 w-5" />
                            )}
                          </div>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              comp.level === "Mastered"
                                ? "bg-emerald-100 text-emerald-800"
                                : comp.level === "Proficient"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {comp.level.toUpperCase()}
                          </span>
                        </div>

                        <h3 className="font-bold text-slate-900 text-base">{comp.domain}</h3>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                          {comp.summary}
                        </p>
                      </div>

                      <div className="mt-6 pt-4 border-t border-slate-100">
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="font-semibold text-slate-600">Verification Score</span>
                          <span className="font-bold text-slate-900">{comp.score_percent}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              comp.score_percent >= 90
                                ? "bg-emerald-500"
                                : comp.score_percent >= 70
                                ? "bg-blue-500"
                                : "bg-slate-300"
                            }`}
                            style={{ width: `${comp.score_percent}%` }}
                          ></div>
                        </div>
                        <span className="text-[11px] text-slate-400 block mt-2">
                          {comp.verified_rules_count} Automated Rules Tested & Passed
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Completed Incident Trail Table */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center space-x-2 mb-4">
                <Clock className="h-5 w-5 text-blue-600" />
                <h2 className="text-lg font-bold text-slate-900">Verified Incident History</h2>
              </div>

              {portfolio.history.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No verified incidents recorded yet. Complete missions from your dashboard to populate your record.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        <th className="py-3 px-4">Mission Title</th>
                        <th className="py-3 px-4">Category</th>
                        <th className="py-3 px-4 text-center">Mode</th>
                        <th className="py-3 px-4 text-center">Final Score</th>
                        <th className="py-3 px-4">Completion Date</th>
                        <th className="py-3 px-4 text-right">Verification Verdict</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {portfolio.history.map((rec: CompletedMissionRecord) => (
                        <tr key={rec.attempt_id} className="hover:bg-slate-50 transition">
                          <td className="py-3.5 px-4 font-bold text-slate-900">
                            {rec.mission_title}
                          </td>
                          <td className="py-3.5 px-4 text-slate-600">
                            {rec.category}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 uppercase">
                              {rec.mode}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-900">
                            {rec.final_score} / 100
                          </td>
                          <td className="py-3.5 px-4 text-slate-500">
                            {new Date(rec.completed_at).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span>100% Deterministic Pass</span>
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
