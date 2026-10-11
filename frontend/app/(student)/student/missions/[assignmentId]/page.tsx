"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  api,
  AttemptStateResponse,
  VerifyAttemptResponse,
  RuleResultItem,
  HintAttemptStatusResponse,
  PostMortemResponse
} from "@/lib/api";
import {
  ShieldCheck,
  ArrowLeft,
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lock,
  FileCode,
  Sliders,
  Check,
  Save,
  Clock,
  Sparkles,
  Coins,
  Lightbulb,
  ChevronRight,
  X,
  Key,
  Plus,
  Trash2
} from "lucide-react";

export default function MissionWorkbenchPage() {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [attempt, setAttempt] = useState<AttemptStateResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Editable S3 Demo Configuration State
  const [bucketName, setBucketName] = useState("");
  const [bpa, setBpa] = useState({
    BlockPublicAcls: false,
    IgnorePublicAcls: false,
    BlockPublicPolicy: false,
    RestrictPublicBuckets: false,
  });
  const [bucketAcl, setBucketAcl] = useState("public-read");
  const [bucketPolicyJson, setBucketPolicyJson] = useState("");

  // Editable IAM Demo Configuration State (Mission 2)
  const [roleName, setRoleName] = useState("WorkerLambdaExecutionRole");
  const [attachedPolicies, setAttachedPolicies] = useState<string[]>([
    "arn:aws:iam::aws:policy/AdministratorAccess",
  ]);
  const [inlinePolicyJson, setInlinePolicyJson] = useState("");
  const [trustPolicyJson, setTrustPolicyJson] = useState("");
  const [customPolicyInput, setCustomPolicyInput] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Verification State
  const [isVerifying, setIsVerifying] = useState(false);
  const [verdictData, setVerdictData] = useState<VerifyAttemptResponse | null>(null);
  const [showVerdictModal, setShowVerdictModal] = useState(false);

  // AI Post-Mortem State
  const [postMortem, setPostMortem] = useState<PostMortemResponse | null>(null);
  const [isLoadingPostMortem, setIsLoadingPostMortem] = useState(false);
  const [postMortemError, setPostMortemError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"workbench" | "postmortem">("workbench");

  const fetchPostMortem = async () => {
    if (!attempt) return;
    try {
      setIsLoadingPostMortem(true);
      setPostMortemError(null);
      const data = await api.getPostMortem(attempt.attempt_id);
      setPostMortem(data);
    } catch (err: any) {
      setPostMortemError(err.message || "Failed to load AI Post-Mortem. Complete verification first.");
    } finally {
      setIsLoadingPostMortem(false);
    }
  };

  // Virtual Hint Economy State
  const [hintStatus, setHintStatus] = useState<HintAttemptStatusResponse | null>(null);
  const [isHintDrawerOpen, setIsHintDrawerOpen] = useState(false);
  const [isUnlockingHint, setIsUnlockingHint] = useState<number | null>(null);
  const [hintError, setHintError] = useState<string | null>(null);

  const fetchHints = useCallback(async (attemptId: string) => {
    try {
      setHintError(null);
      const data = await api.getHintStatus(attemptId);
      setHintStatus(data);
    } catch (err: any) {
      console.error("Failed to load hints:", err);
    }
  }, []);

  const handleUnlockHint = async (level: number) => {
    if (!attempt) return;
    try {
      setIsUnlockingHint(level);
      setHintError(null);
      await api.unlockHint(attempt.attempt_id, level);
      await fetchHints(attempt.attempt_id);
      // Update attempt penalty score
      const penaltyIncrement = level === 1 ? 5 : level === 2 ? 10 : level === 3 ? 15 : 20;
      setAttempt((prev) =>
        prev
          ? {
              ...prev,
              penalty_score: (prev.penalty_score || 0) + penaltyIncrement,
            }
          : null
      );
    } catch (err: any) {
      setHintError(err.message || "Failed to unlock hint.");
    } finally {
      setIsUnlockingHint(null);
    }
  };

  const initAttempt = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await api.startMission(assignmentId, { mode: "demo" });
      setAttempt(data);
      fetchHints(data.attempt_id);

      // Hydrate editor state from attempt's demo state
      if (data.current_demo_state) {
        const state = data.current_demo_state;
        if (data.mission_slug === "iam-overprivileged-lambda") {
          setRoleName(state.role_name || "WorkerLambdaExecutionRole");
          setAttachedPolicies(state.attached_managed_policies || []);
          setInlinePolicyJson(
            state.inline_policy ? JSON.stringify(state.inline_policy, null, 2) : ""
          );
          setTrustPolicyJson(
            state.trust_policy ? JSON.stringify(state.trust_policy, null, 2) : ""
          );
        } else {
          setBucketName(state.bucket_name || "cloudproof-acme-invoices-2026");
          setBpa(
            state.public_access_block || {
              BlockPublicAcls: false,
              IgnorePublicAcls: false,
              BlockPublicPolicy: false,
              RestrictPublicBuckets: false,
            }
          );
          setBucketAcl(state.bucket_acl || "public-read");
          setBucketPolicyJson(
            state.bucket_policy
              ? JSON.stringify(state.bucket_policy, null, 2)
              : ""
          );
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to initialize mission attempt.");
    } finally {
      setIsLoading(false);
    }
  }, [assignmentId]);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "student")) {
      router.push("/login");
      return;
    }

    if (user && user.role === "student" && assignmentId) {
      initAttempt();
    }
  }, [user, authLoading, assignmentId, router, initAttempt]);

  const handleSaveState = async () => {
    if (!attempt) return;

    try {
      setIsSaving(true);
      setError(null);

      let updatedState: any = {};
      if (attempt.mission_slug === "iam-overprivileged-lambda") {
        let parsedInline = null;
        if (inlinePolicyJson.trim()) {
          try {
            parsedInline = JSON.parse(inlinePolicyJson);
          } catch {
            setError("Invalid JSON format in IAM Inline Policy.");
            setIsSaving(false);
            return;
          }
        }
        let parsedTrust = null;
        if (trustPolicyJson.trim()) {
          try {
            parsedTrust = JSON.parse(trustPolicyJson);
          } catch {
            setError("Invalid JSON format in Trust Policy.");
            setIsSaving(false);
            return;
          }
        }
        updatedState = {
          role_name: roleName,
          attached_managed_policies: attachedPolicies,
          inline_policy: parsedInline,
          trust_policy: parsedTrust,
        };
      } else {
        let parsedPolicy = null;
        if (bucketPolicyJson.trim()) {
          try {
            parsedPolicy = JSON.parse(bucketPolicyJson);
          } catch {
            setError("Invalid JSON format in Bucket Policy.");
            setIsSaving(false);
            return;
          }
        }
        updatedState = {
          bucket_name: bucketName,
          public_access_block: bpa,
          bucket_acl: bucketAcl,
          bucket_policy: parsedPolicy,
        };
      }

      await api.updateDemoState(attempt.attempt_id, updatedState);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err: any) {
      setError(err.message || "Failed to save configuration state.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleVerify = async () => {
    if (!attempt) return;

    // Auto-save any pending changes first
    await handleSaveState();

    try {
      setIsVerifying(true);
      setError(null);
      const res = await api.verifyAttempt(attempt.attempt_id);
      setVerdictData(res);
      setShowVerdictModal(true);

      // Prefetch post-mortem debrief
      api.getPostMortem(attempt.attempt_id).then(setPostMortem).catch(() => {});

      // Refresh attempt state
      setAttempt((prev) =>
        prev
          ? {
              ...prev,
              status: res.status,
              final_score: res.final_score,
            }
          : null
      );
    } catch (err: any) {
      setError(err.message || "Verification failed to execute.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleClearPolicy = () => {
    setBucketPolicyJson("");
  };

  const handleEnableAllBpa = () => {
    setBpa({
      BlockPublicAcls: true,
      IgnorePublicAcls: true,
      BlockPublicPolicy: true,
      RestrictPublicBuckets: true,
    });
  };

  const handleDetachPolicy = (arnToDetach: string) => {
    setAttachedPolicies((prev) => prev.filter((arn) => arn !== arnToDetach));
  };

  const handleAttachPolicy = (arnToAttach: string) => {
    const trimmed = arnToAttach.trim();
    if (!trimmed) return;
    if (!attachedPolicies.includes(trimmed)) {
      setAttachedPolicies((prev) => [...prev, trimmed]);
    }
    setCustomPolicyInput("");
  };

  const handleLoadScopedTemplate = () => {
    const template = {
      Version: "2012-10-17",
      Statement: [
        {
          Sid: "AllowScopedInvoiceAccess",
          Effect: "Allow",
          Action: [
            "s3:GetObject",
            "s3:PutObject"
          ],
          Resource: "arn:aws:s3:::company-invoices-2026/*"
        }
      ]
    };
    setInlinePolicyJson(JSON.stringify(template, null, 2));
  };

  const handleClearInlinePolicy = () => {
    setInlinePolicyJson("");
  };

  if (authLoading || (isLoading && !attempt)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-slate-600">Initializing cloud incident environment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navigation */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link
              href="/student/dashboard"
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
              title="Return to Dashboard"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="bg-blue-600 text-white p-1.5 rounded-lg">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <span className="font-bold text-lg text-slate-900 tracking-tight">CloudProof</span>
              <span className="ml-2 text-xs font-semibold px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full">
                Mission Workbench
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Simulation Mode (Zero Cost)</span>
            </div>

            <button
              onClick={() => {
                setIsHintDrawerOpen(true);
                if (attempt) fetchHints(attempt.attempt_id);
              }}
              className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-lg text-xs font-semibold shadow-sm transition flex items-center space-x-1.5"
              title="View Incident Hints & Guidance"
            >
              <Lightbulb className="h-3.5 w-3.5 text-amber-600" />
              <span>Hints</span>
              {hintStatus && (
                <span className="ml-1 bg-amber-200 text-amber-900 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {hintStatus.wallet_balance} 🪙
                </span>
              )}
            </button>

            <button
              onClick={handleSaveState}
              disabled={isSaving}
              className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold shadow-sm transition flex items-center space-x-1.5 disabled:opacity-50"
            >
              {saveSuccess ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Saved!</span>
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5" />
                  <span>{isSaving ? "Saving..." : "Save State"}</span>
                </>
              )}
            </button>

            <button
              onClick={handleVerify}
              disabled={isVerifying}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-md transition flex items-center space-x-2 disabled:opacity-50"
            >
              {isVerifying ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Verifying Rules...</span>
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5 fill-current" />
                  <span>Verify Fix</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Subheader Navigation Tabs */}
      <div className="bg-white border-b border-slate-200 px-6 py-2 sticky top-[57px] z-20">
        <div className="max-w-7xl mx-auto flex items-center space-x-3">
          <button
            onClick={() => setActiveTab("workbench")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-2 ${
              activeTab === "workbench"
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Sliders className="h-3.5 w-3.5" />
            <span>Interactive Workbench</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("postmortem");
              if (!postMortem) {
                fetchPostMortem();
              }
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-2 ${
              activeTab === "postmortem"
                ? "bg-purple-700 text-white shadow-sm"
                : "text-slate-600 hover:text-purple-700 hover:bg-purple-50"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 text-purple-400" />
            <span>AI Incident Post-Mortem</span>
            {attempt?.status === "passed" && (
              <span className="bg-emerald-500 text-white text-[9px] px-1.5 py-0.2 rounded-full font-bold ml-1">
                Ready
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main Workbench Body */}
      <main className="max-w-7xl mx-auto w-full px-6 py-8 flex-1">
        {activeTab === "postmortem" ? (
          <div className="space-y-8 animate-in fade-in duration-150">
            {/* Post-Mortem Banner */}
            <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-lg border border-purple-800">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center space-x-2 bg-purple-500/20 text-purple-200 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2 border border-purple-500/30">
                    <Sparkles className="h-3.5 w-3.5 text-purple-300" />
                    <span>AI Incident Explanation Layer • Grounded Analysis</span>
                  </div>
                  <h1 className="text-2xl font-bold tracking-tight">
                    Incident Post-Mortem: {postMortem?.mission_title || attempt?.mission_title}
                  </h1>
                  <p className="text-xs text-purple-200 mt-1 max-w-2xl leading-relaxed">
                    Generated by {postMortem?.generated_by || "CloudProof Engine"}. This report is 100% grounded in the deterministic rule verification ground truth. The AI does not grade; it explains the underlying security mechanics.
                  </p>
                </div>

                <div className="flex items-center space-x-3 shrink-0">
                  <span
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider ${
                      postMortem?.verdict_status === "PASS"
                        ? "bg-emerald-500 text-white"
                        : "bg-red-500 text-white"
                    }`}
                  >
                    Verdict: {postMortem?.verdict_status || (attempt?.status === "passed" ? "PASS" : "IN PROGRESS")}
                  </span>
                  <button
                    onClick={() => setActiveTab("workbench")}
                    className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-xl transition"
                  >
                    Back to Workbench
                  </button>
                </div>
              </div>
            </div>

            {isLoadingPostMortem && (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
                <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                <h3 className="text-sm font-bold text-slate-800">Generating Grounded Security Post-Mortem...</h3>
                <p className="text-xs text-slate-500 mt-1">Analyzing rule engine results, diffs, and AWS evaluation semantics</p>
              </div>
            )}

            {postMortemError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between text-sm text-red-700">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 shrink-0" />
                  <span>{postMortemError}</span>
                </div>
                <button
                  onClick={fetchPostMortem}
                  className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-800 text-xs font-bold rounded-lg transition"
                >
                  Retry
                </button>
              </div>
            )}

            {postMortem && !isLoadingPostMortem && (
              <div className="space-y-6">
                {/* 1. Incident Summary */}
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                  <div className="flex items-center space-x-2 mb-3">
                    <ShieldCheck className="h-5 w-5 text-indigo-600" />
                    <h2 className="text-base font-bold text-slate-900">1. Executive Incident Summary</h2>
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {postMortem.incident_summary}
                  </p>
                </div>

                {/* 2. Root Cause Analysis */}
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                  <div className="flex items-center space-x-2 mb-3">
                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                    <h2 className="text-base font-bold text-slate-900">2. Root Cause Analysis</h2>
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {postMortem.root_cause_analysis}
                  </p>
                </div>

                {/* 3. Threat Exploit Scenario */}
                <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 shadow-sm text-slate-100">
                  <div className="flex items-center space-x-2 mb-3">
                    <Lock className="h-5 w-5 text-red-400" />
                    <h2 className="text-base font-bold text-white">3. Realistic Threat Exploit Scenario</h2>
                  </div>
                  <div className="text-xs font-mono text-emerald-400 leading-relaxed whitespace-pre-wrap bg-slate-950 p-4 rounded-lg border border-slate-800">
                    {postMortem.threat_exploit_scenario}
                  </div>
                </div>

                {/* 4. Remediation Diff Breakdown */}
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                  <div className="flex items-center space-x-2 mb-3">
                    <Sliders className="h-5 w-5 text-blue-600" />
                    <h2 className="text-base font-bold text-slate-900">4. Remediation Diff Breakdown</h2>
                  </div>
                  <div className="text-xs font-mono text-slate-800 leading-relaxed whitespace-pre-wrap bg-slate-50 p-4 rounded-lg border border-slate-200">
                    {postMortem.remediation_diff_breakdown}
                  </div>
                </div>

                {/* 5. Why the Fix Works */}
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                  <div className="flex items-center space-x-2 mb-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    <h2 className="text-base font-bold text-slate-900">5. Security Mechanics & Evaluation Logic</h2>
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {postMortem.why_fix_works}
                  </p>
                </div>

                {/* 6. Production Best Practices */}
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                  <div className="flex items-center space-x-2 mb-3">
                    <Sparkles className="h-5 w-5 text-purple-600" />
                    <h2 className="text-base font-bold text-slate-900">6. Production Best Practices & AWS Well-Architected</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    {postMortem.best_practices.map((rec, i) => (
                      <div
                        key={i}
                        className="p-4 rounded-xl border border-purple-100 bg-purple-50/30 flex items-start space-x-3"
                      >
                        <span className="h-6 w-6 rounded-full bg-purple-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                          {i + 1}
                        </span>
                        <p className="text-xs text-slate-700 font-medium leading-relaxed">{rec}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div>
            {/* Incident Briefing Banner */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-8 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center space-x-2 bg-red-50 text-red-700 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
                <span>
                  {attempt?.mission_slug === "iam-overprivileged-lambda"
                    ? "Active Incident: IAM & Privilege Escalation"
                    : "Active Incident: Storage Security"}
                </span>
              </div>
              <h1 className="text-2xl font-bold text-slate-900">{attempt?.mission_title}</h1>
              <p className="text-sm text-slate-600 mt-2 max-w-3xl leading-relaxed">
                {attempt?.mission_slug === "iam-overprivileged-lambda" ? (
                  <>
                    A startup backend Lambda microservice was deployed with full <code className="font-mono text-xs bg-slate-100 px-1 py-0.5 rounded text-red-600 font-bold">AdministratorAccess</code> and wildcard permissions.
                    If compromised via a dependency vulnerability or SSRF, attackers can escalate privileges, access arbitrary AWS resources, or delete production infrastructure.
                    Your mission is to detach the root admin policy, preserve CloudWatch logging, and craft a scoped least-privilege inline policy allowing only required S3 invoice processing.
                  </>
                ) : (
                  <>
                    A startup accidentally exposed confidential customer PDF invoices through an Amazon S3 bucket.
                    Anyone on the public internet can download invoices without authentication. Your mission is to
                    investigate the S3 configuration below, identify why the bucket is exposed, and remediate the vulnerability.
                  </>
                )}
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 min-w-[200px] shrink-0 text-right">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Status
              </span>
              <span
                className={`text-sm font-bold uppercase block mt-0.5 ${
                  attempt?.status === "passed"
                    ? "text-emerald-600"
                    : attempt?.status === "failed"
                    ? "text-red-600"
                    : "text-amber-600"
                }`}
              >
                {attempt?.status === "passed"
                  ? "VERIFIED & PASSED"
                  : attempt?.status === "failed"
                  ? "ATTEMPT FAILED"
                  : "IN PROGRESS"}
              </span>
              <span className="text-xs text-slate-500 block mt-1">
                Score: <strong>{attempt?.final_score || 0} / 100</strong>
              </span>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-3 text-sm text-red-700">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Configuration Inspector Grid */}
        {attempt?.mission_slug === "iam-overprivileged-lambda" ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column: Attached Managed Policies & Trust Policy */}
            <div className="space-y-6">
              {/* Attached Managed Policies */}
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <Key className="h-5 w-5 text-purple-600" />
                    <h3 className="font-bold text-slate-900 text-base">Attached Managed Policies</h3>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    {attachedPolicies.length} Attached
                  </span>
                </div>

                <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                  AWS Managed Policies attached directly to this Lambda IAM Role. Identify and detach overly permissive policies, and ensure minimal required service roles are attached.
                </p>

                {/* List of Attached Policies */}
                <div className="space-y-3 mb-5">
                  {attachedPolicies.length === 0 ? (
                    <div className="p-4 border border-dashed border-slate-200 rounded-lg text-center text-xs text-slate-400">
                      No managed policies currently attached to this IAM role.
                    </div>
                  ) : (
                    attachedPolicies.map((arn) => {
                      const isAdmin = arn.includes("AdministratorAccess");
                      const isLambdaBasic = arn.includes("AWSLambdaBasicExecutionRole");
                      const policyName = arn.split("/").pop() || arn;

                      return (
                        <div
                          key={arn}
                          className={`p-3.5 rounded-xl border flex items-center justify-between transition ${
                            isAdmin
                              ? "border-red-200 bg-red-50/50"
                              : isLambdaBasic
                              ? "border-emerald-200 bg-emerald-50/40"
                              : "border-slate-200 bg-slate-50"
                          }`}
                        >
                          <div className="flex-1 pr-3 min-w-0">
                            <div className="flex items-center space-x-2">
                              <span className="font-mono text-xs font-bold text-slate-900 truncate">
                                {policyName}
                              </span>
                              {isAdmin && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 shrink-0">
                                  CRITICAL RISK
                                </span>
                              )}
                              {isLambdaBasic && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 shrink-0">
                                  LOGGING
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-500 font-mono truncate block mt-0.5">
                              {arn}
                            </span>
                            {isAdmin && (
                              <p className="text-[11px] text-red-600 mt-1">
                                Grants wildcard (<code>*:*</code>) administrative access to all AWS resources. Violates least-privilege.
                              </p>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDetachPolicy(arn)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-white rounded-lg border border-transparent hover:border-red-200 transition shrink-0"
                            title={`Detach ${policyName}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Quick Attach Helpers */}
                <div className="pt-4 border-t border-slate-100 space-y-3">
                  <span className="text-xs font-bold text-slate-700 block">Quick Policy Actions:</span>
                  <div className="flex flex-wrap gap-2">
                    {!attachedPolicies.includes("arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole") && (
                      <button
                        type="button"
                        onClick={() =>
                          handleAttachPolicy(
                            "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
                          )
                        }
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold hover:bg-emerald-100 transition flex items-center space-x-1.5"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Attach AWSLambdaBasicExecutionRole</span>
                      </button>
                    )}
                    {attachedPolicies.includes("arn:aws:iam::aws:policy/AdministratorAccess") && (
                      <button
                        type="button"
                        onClick={() =>
                          handleDetachPolicy("arn:aws:iam::aws:policy/AdministratorAccess")
                        }
                        className="px-2.5 py-1.5 rounded-lg bg-red-50 text-red-700 border border-red-200 text-xs font-semibold hover:bg-red-100 transition flex items-center space-x-1.5"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Detach AdministratorAccess</span>
                      </button>
                    )}
                  </div>

                  {/* Custom ARN Attach Input */}
                  <div className="flex items-center space-x-2 pt-2">
                    <input
                      type="text"
                      value={customPolicyInput}
                      onChange={(e) => setCustomPolicyInput(e.target.value)}
                      placeholder="arn:aws:iam::aws:policy/..."
                      className="flex-1 px-3 py-1.5 text-xs font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleAttachPolicy(customPolicyInput)}
                      className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition"
                    >
                      Attach
                    </button>
                  </div>
                </div>
              </div>

              {/* Trust Policy (AssumeRolePolicyDocument) */}
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Lock className="h-5 w-5 text-purple-600" />
                    <h3 className="font-bold text-slate-900 text-base">IAM Trust Relationship</h3>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    lambda.amazonaws.com
                  </span>
                </div>
                <p className="text-xs text-slate-500 mb-3 leading-relaxed">
                  Defines the trusted entity allowed to assume this IAM Role via <code>sts:AssumeRole</code>. Lambda requires service trust.
                </p>
                <textarea
                  rows={6}
                  value={trustPolicyJson}
                  onChange={(e) => setTrustPolicyJson(e.target.value)}
                  placeholder="Trust relationship policy JSON..."
                  className="w-full p-3 font-mono text-xs border border-slate-300 rounded-lg bg-slate-900 text-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500 leading-relaxed"
                />
              </div>
            </div>

            {/* Right Column: Inline Policy JSON Editor */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <FileCode className="h-5 w-5 text-purple-600" />
                    <h3 className="font-bold text-slate-900 text-base">Inline Customer Policy (JSON)</h3>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={handleLoadScopedTemplate}
                      className="text-xs font-semibold text-purple-600 hover:text-purple-800 bg-purple-50 px-2.5 py-1 rounded-md border border-purple-200 transition"
                    >
                      Load Scoped S3 Template
                    </button>
                    <button
                      type="button"
                      onClick={handleClearInlinePolicy}
                      className="text-xs font-semibold text-red-600 hover:text-red-800"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-500 mb-3 leading-relaxed">
                  Grant least-privilege permissions specifically for invoice processing. Specify explicit actions (e.g. <code>s3:GetObject</code>, <code>s3:PutObject</code>) and target resources (<code>arn:aws:s3:::company-invoices-2026/*</code>). Wildcards and IAM escalation primitives are strictly blocked.
                </p>

                <textarea
                  rows={16}
                  value={inlinePolicyJson}
                  onChange={(e) => setInlinePolicyJson(e.target.value)}
                  placeholder="Paste or write scoped inline policy JSON here..."
                  className="w-full p-3 font-mono text-xs border border-slate-300 rounded-lg bg-slate-900 text-emerald-400 focus:outline-none focus:ring-2 focus:ring-purple-500 leading-relaxed"
                />
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  Target Role: <strong className="font-mono text-slate-700">{roleName}</strong>
                </span>
                <button
                  type="button"
                  onClick={handleSaveState}
                  className="text-xs font-semibold text-purple-600 hover:underline"
                >
                  Apply Changes
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column: S3 Block Public Access & ACL */}
            <div className="space-y-6">
              {/* Block Public Access Box */}
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <Sliders className="h-5 w-5 text-blue-600" />
                    <h3 className="font-bold text-slate-900 text-base">S3 Block Public Access (BPA)</h3>
                  </div>
                  <button
                    type="button"
                    onClick={handleEnableAllBpa}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                  >
                    Enable All (Recommended)
                  </button>
                </div>

                <div className="space-y-4">
                  {[
                    {
                      key: "BlockPublicAcls",
                      label: "Block public access to buckets and objects granted through new public ACLs",
                      desc: "Blocks new public ACLs and uploading objects with public ACLs.",
                    },
                    {
                      key: "IgnorePublicAcls",
                      label: "Ignore all public ACLs on this bucket and any objects that it contains",
                      desc: "Causes AWS S3 to ignore all public ACLs on this bucket and its objects.",
                    },
                    {
                      key: "BlockPublicPolicy",
                      label: "Block public access to buckets and objects granted through any public bucket policy",
                      desc: "Rejects bucket policies that allow public, unauthenticated access.",
                    },
                    {
                      key: "RestrictPublicBuckets",
                      label: "Restrict public access to this bucket only to AWS service principals and authorized users",
                      desc: "Restricts bucket access to AWS service principals and authorized users in the bucket owner account.",
                    },
                  ].map((item) => {
                    const isChecked = (bpa as any)[item.key];
                    return (
                      <label
                        key={item.key}
                        className="flex items-start justify-between p-3 rounded-lg border border-slate-100 hover:bg-slate-50 cursor-pointer transition"
                      >
                        <div className="pr-4">
                          <span className="text-xs font-bold text-slate-900 block font-mono">
                            {item.key}
                          </span>
                          <span className="text-xs text-slate-500 block mt-0.5">{item.desc}</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) =>
                            setBpa((prev) => ({ ...prev, [item.key]: e.target.checked }))
                          }
                          className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Canned ACL Box */}
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                <div className="flex items-center space-x-2 mb-3">
                  <Lock className="h-5 w-5 text-blue-600" />
                  <h3 className="font-bold text-slate-900 text-base">Bucket Canned ACL</h3>
                </div>
                <p className="text-xs text-slate-500 mb-4">
                  Access Control Lists define basic read/write grants on the bucket resource.
                </p>

                <select
                  value={bucketAcl}
                  onChange={(e) => setBucketAcl(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="private">private (Recommended - Bucket owner has full control)</option>
                  <option value="public-read">public-read (VULNERABLE - Anonymous users can read)</option>
                  <option value="public-read-write">public-read-write (DANGEROUS - Global write access)</option>
                  <option value="authenticated-read">authenticated-read (All AWS accounts can read)</option>
                </select>
              </div>
            </div>

            {/* Right Column: Bucket Policy JSON Editor */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <FileCode className="h-5 w-5 text-blue-600" />
                    <h3 className="font-bold text-slate-900 text-base">Bucket Policy (JSON)</h3>
                  </div>
                  <button
                    type="button"
                    onClick={handleClearPolicy}
                    className="text-xs font-semibold text-red-600 hover:text-red-800"
                  >
                    Clear Policy
                  </button>
                </div>
                <p className="text-xs text-slate-500 mb-3">
                  An IAM resource policy attached to the bucket. Inspect statements granting anonymous Principal access.
                </p>

                <textarea
                  rows={16}
                  value={bucketPolicyJson}
                  onChange={(e) => setBucketPolicyJson(e.target.value)}
                  placeholder="No bucket policy attached (or paste JSON policy here)..."
                  className="w-full p-3 font-mono text-xs border border-slate-300 rounded-lg bg-slate-900 text-emerald-400 focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed"
                />
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  Target Resource: <strong className="font-mono text-slate-700">arn:aws:s3:::{bucketName}</strong>
                </span>
                <button
                  type="button"
                  onClick={handleSaveState}
                  className="text-xs font-semibold text-blue-600 hover:underline"
                >
                  Apply Changes
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )}
  </main>

      {/* Verification Verdict Modal */}
      {showVerdictModal && verdictData && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <div className="flex items-center space-x-3">
                {verdictData.verdict.status === "PASS" ? (
                  <div className="bg-emerald-50 text-emerald-600 p-2.5 rounded-full">
                    <CheckCircle2 className="h-7 w-7" />
                  </div>
                ) : (
                  <div className="bg-red-50 text-red-600 p-2.5 rounded-full">
                    <XCircle className="h-7 w-7" />
                  </div>
                )}
                <div>
                  <h3 className="text-xl font-bold text-slate-900">
                    {verdictData.verdict.status === "PASS"
                      ? "MISSION COMPLETED!"
                      : "VERIFICATION FAILED"}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Deterministic checks completed in {verdictData.verdict.execution_time_ms} ms
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-2xl font-extrabold text-slate-900">
                  {verdictData.verdict.base_points_earned} / {verdictData.verdict.max_points_possible}
                </span>
                <span className="block text-[10px] uppercase font-bold text-slate-400">
                  Points Earned
                </span>
              </div>
            </div>

            {/* Rules Breakdown List */}
            <div className="space-y-3 mb-6">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Automated Verification Rules ({verdictData.verdict.passed_rules} / {verdictData.verdict.total_rules} Passed)
              </h4>

              {verdictData.verdict.rule_results.map((rule: RuleResultItem) => (
                <div
                  key={rule.rule_id}
                  className={`p-3.5 rounded-xl border flex items-start space-x-3 transition ${
                    rule.status === "PASS"
                      ? "border-emerald-200 bg-emerald-50/40"
                      : "border-red-200 bg-red-50/40"
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {rule.status === "PASS" ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-slate-900">
                        {rule.rule_id}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          rule.status === "PASS"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {rule.points_earned} / {rule.max_points} pts
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 mt-0.5 font-medium">{rule.name}</p>
                    <p className="text-xs text-slate-500 mt-1">{rule.evidence}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Actions */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowVerdictModal(false)}
                className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 font-medium"
              >
                Close & Keep Editing
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowVerdictModal(false);
                  setActiveTab("postmortem");
                  fetchPostMortem();
                }}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-bold shadow-md transition flex items-center space-x-2"
              >
                <Sparkles className="h-4 w-4" />
                <span>AI Post-Mortem</span>
              </button>
              {verdictData.verdict.status === "PASS" && (
                <Link
                  href="/student/dashboard"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold shadow-md transition"
                >
                  Return to Dashboard
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Slide-over Hint Drawer */}
      {isHintDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setIsHintDrawerOpen(false)}
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-white shadow-2xl border-l border-slate-200 flex flex-col h-full animate-in slide-in-from-right duration-200">
              {/* Drawer Header */}
              <div className="p-6 border-b border-slate-200 flex items-start justify-between bg-slate-50">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-amber-100 text-amber-700 rounded-lg">
                    <Lightbulb className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Incident Assistance</h2>
                    <p className="text-xs text-slate-500">Progressive disclosure hint system</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsHintDrawerOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50 transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Virtual Hint Economy Bar */}
              <div className="bg-amber-50/70 border-b border-amber-200/60 p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-amber-900">
                    <Coins className="h-4 w-4 text-amber-600" />
                    <span>Daily Wallet Balance:</span>
                  </div>
                  <span className="font-extrabold text-amber-900 text-sm">
                    {hintStatus?.wallet_balance ?? 10} / 10 Tokens
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-amber-800">
                  <span>Current Hint Penalty Applied:</span>
                  <span className="font-bold text-red-600">
                    -{hintStatus?.total_penalty_percent ?? 0}%
                  </span>
                </div>

                <p className="mt-2 text-[11px] text-amber-700/90 leading-tight">
                  Hints cost tokens and apply a score penalty. Try solving the incident on your own first!
                </p>
              </div>

              {hintError && (
                <div className="m-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2 text-xs text-red-700">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>{hintError}</span>
                </div>
              )}

              {/* Hints List */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {hintStatus?.hints && hintStatus.hints.length > 0 ? (
                  hintStatus.hints.map((hint) => {
                    const isUnlocked = hint.is_unlocked;
                    const isUnlockable =
                      !isUnlocked &&
                      (hint.level === 1 ||
                        hintStatus.hints.some((h) => h.level === hint.level - 1 && h.is_unlocked));
                    const hasTokens = (hintStatus.wallet_balance ?? 0) >= hint.token_cost;

                    return (
                      <div
                        key={hint.id || hint.level}
                        className={`rounded-xl border transition p-4 ${
                          isUnlocked
                            ? "border-emerald-200 bg-emerald-50/20"
                            : isUnlockable
                            ? "border-amber-200 bg-white shadow-sm"
                            : "border-slate-200 bg-slate-50/60 opacity-70"
                        }`}
                      >
                        {/* Tier Title and Status */}
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
                              Tier {hint.level}
                            </span>
                            <span className="text-xs font-bold text-slate-900">
                              {hint.title}
                            </span>
                          </div>

                          {isUnlocked ? (
                            <span className="inline-flex items-center space-x-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                              <CheckCircle2 className="h-3 w-3" />
                              <span>Unlocked (-{hint.penalty_percent}%)</span>
                            </span>
                          ) : (
                            <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                              {hint.token_cost} 🪙 (-{hint.penalty_percent}%)
                            </span>
                          )}
                        </div>

                        {/* Unlocked Content or Locked Action */}
                        {isUnlocked ? (
                          <div className="mt-2 p-3 bg-white border border-emerald-100 rounded-lg text-xs text-slate-800 leading-relaxed font-mono whitespace-pre-wrap">
                            {hint.content}
                          </div>
                        ) : isUnlockable ? (
                          <div className="mt-3">
                            <p className="text-xs text-slate-500 mb-2">
                              Unlocks guidance for this investigation phase. Deducts {hint.token_cost} token{hint.token_cost > 1 ? "s" : ""} and applies -{hint.penalty_percent}% to your score.
                            </p>
                            <button
                              type="button"
                              onClick={() => handleUnlockHint(hint.level)}
                              disabled={isUnlockingHint === hint.level || !hasTokens}
                              className={`w-full py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-2 ${
                                hasTokens
                                  ? "bg-amber-500 hover:bg-amber-600 text-slate-900 shadow-sm cursor-pointer"
                                  : "bg-slate-200 text-slate-500 cursor-not-allowed"
                              }`}
                            >
                              {isUnlockingHint === hint.level ? (
                                <>
                                  <div className="w-3.5 h-3.5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
                                  <span>Unlocking Hint...</span>
                                </>
                              ) : hasTokens ? (
                                <>
                                  <Lightbulb className="h-3.5 w-3.5" />
                                  <span>Unlock Tier {hint.level} ({hint.token_cost} Tokens)</span>
                                </>
                              ) : (
                                <span>Insufficient Tokens ({hintStatus.wallet_balance}/{hint.token_cost})</span>
                              )}
                            </button>
                          </div>
                        ) : (
                          <div className="mt-2 flex items-center space-x-2 text-xs text-slate-400">
                            <Lock className="h-3.5 w-3.5 shrink-0" />
                            <span>Unlock Tier {hint.level - 1} first to access this hint.</span>
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="p-8 text-center text-xs text-slate-400">
                    No hints configured for this mission.
                  </div>
                )}
              </div>

              {/* Drawer Footer */}
              <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => setIsHintDrawerOpen(false)}
                  className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-lg transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
