"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  api,
  ClassDetailResponse,
  CatalogMissionItem,
  RosterStudentItem,
  StudentProgressItem,
  CommonMistakeItem
} from "@/lib/api";
import {
  ShieldCheck,
  ArrowLeft,
  Users,
  BookOpen,
  AlertTriangle,
  Plus,
  CheckCircle2,
  Clock,
  Copy,
  Check,
  BarChart3,
  Lightbulb
} from "lucide-react";

export default function ClassDetailsPage() {
  const { classId } = useParams<{ classId: string }>();
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [classDetails, setClassDetails] = useState<ClassDetailResponse | null>(null);
  const [catalog, setCatalog] = useState<CatalogMissionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tab State: 'roster' | 'missions' | 'mistakes'
  const [activeTab, setActiveTab] = useState<"roster" | "missions" | "mistakes">("roster");

  // Assign Mission Modal State
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedMissionId, setSelectedMissionId] = useState<string>("");
  const [isAssigning, setIsAssigning] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);

  const [copiedCode, setCopiedCode] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [details, missions] = await Promise.all([
        api.getClassDetails(classId),
        api.getMissionCatalog(),
      ]);
      setClassDetails(details);
      setCatalog(missions);
      if (missions.length > 0) {
        setSelectedMissionId(missions[0].id);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load class details.");
    } finally {
      setIsLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "instructor")) {
      router.push("/login");
      return;
    }

    if (user && user.role === "instructor" && classId) {
      loadData();
    }
  }, [user, authLoading, classId, router, loadData]);

  const handleAssignMission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMissionId) return;

    try {
      setIsAssigning(true);
      setAssignError(null);
      await api.assignMission(classId, { mission_id: selectedMissionId });
      setShowAssignModal(false);
      await loadData();
    } catch (err: any) {
      setAssignError(err.message || "Failed to assign mission.");
    } finally {
      setIsAssigning(false);
    }
  };

  const copyJoinCode = () => {
    if (!classDetails?.join_code) return;
    navigator.clipboard.writeText(classDetails.join_code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  if (authLoading || (isLoading && !classDetails)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-slate-600">Loading class data & analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link
              href="/instructor/dashboard"
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
              title="Back to Dashboard"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="bg-blue-600 text-white p-1.5 rounded-lg">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <span className="font-bold text-lg text-slate-900 tracking-tight">CloudProof</span>
              <span className="ml-2 text-xs font-semibold px-2 py-0.5 bg-purple-100 text-purple-800 rounded-full">
                Instructor
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowAssignModal(true)}
              className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition"
            >
              <Plus className="h-4 w-4" />
              <span>Assign Mission</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto w-full px-6 py-8 flex-1">
        {/* Class Overview Banner */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-8 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{classDetails?.name}</h1>
              {classDetails?.description && (
                <p className="text-sm text-slate-600 mt-1">{classDetails.description}</p>
              )}
              <div className="flex items-center space-x-4 mt-3 text-xs text-slate-500">
                <span>
                  Students: <strong className="text-slate-800">{classDetails?.students.length}</strong>
                </span>
                <span>•</span>
                <span>
                  Missions: <strong className="text-slate-800">{classDetails?.assigned_missions.length}</strong>
                </span>
                <span>•</span>
                <span>
                  Created: {new Date(classDetails?.created_at || "").toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Join Code Widget */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center space-x-3">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Join Code
                </span>
                <span className="text-base font-mono font-bold text-blue-600 tracking-wider">
                  {classDetails?.join_code}
                </span>
              </div>
              <button
                onClick={copyJoinCode}
                className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded hover:bg-slate-100 flex items-center space-x-1 transition"
                title="Copy Join Code"
              >
                {copiedCode ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                    <span className="text-emerald-700 font-semibold">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-3 text-sm text-red-700">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 mb-6">
          <button
            onClick={() => setActiveTab("roster")}
            className={`pb-3 px-4 text-sm font-semibold border-b-2 flex items-center space-x-2 transition ${
              activeTab === "roster"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Users className="h-4 w-4" />
            <span>Student Roster & Progress ({classDetails?.students.length ?? 0})</span>
          </button>
          <button
            onClick={() => setActiveTab("missions")}
            className={`pb-3 px-4 text-sm font-semibold border-b-2 flex items-center space-x-2 transition ${
              activeTab === "missions"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <BookOpen className="h-4 w-4" />
            <span>Assigned Missions ({classDetails?.assigned_missions.length ?? 0})</span>
          </button>
          <button
            onClick={() => setActiveTab("mistakes")}
            className={`pb-3 px-4 text-sm font-semibold border-b-2 flex items-center space-x-2 transition ${
              activeTab === "mistakes"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <BarChart3 className="h-4 w-4" />
            <span>Common Mistakes & Failure Analytics</span>
          </button>
        </div>

        {/* Tab 1: Student Roster & Progress Matrix */}
        {activeTab === "roster" && (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            {!classDetails?.students || classDetails.students.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">
                No students enrolled yet. Share the join code{" "}
                <strong className="font-mono text-slate-800">{classDetails?.join_code}</strong> with your students to have them join!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-700">
                  <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Student</th>
                      <th className="py-3 px-4">Email</th>
                      <th className="py-3 px-4">Enrolled On</th>
                      <th className="py-3 px-4">Completed</th>
                      <th className="py-3 px-4">Average Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {classDetails.students.map((student: RosterStudentItem) => (
                      <tr key={student.id} className="hover:bg-slate-50/50 transition">
                        <td className="py-3.5 px-4 font-semibold text-slate-900">{student.full_name}</td>
                        <td className="py-3.5 px-4 text-slate-600">{student.email}</td>
                        <td className="py-3.5 px-4 text-slate-500 text-xs">
                          {new Date(student.enrolled_at).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-800">
                          {student.missions_completed} / {classDetails.assigned_missions.length}
                        </td>
                        <td className="py-3.5 px-4">
                          {student.average_score !== null && student.average_score !== undefined ? (
                            <span className="font-bold text-emerald-600">
                              {Math.round(student.average_score)}%
                            </span>
                          ) : (
                            <span className="text-slate-400">N/A</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Assigned Missions */}
        {activeTab === "missions" && (
          <div>
            {!classDetails?.assigned_missions || classDetails.assigned_missions.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500 text-sm">
                No missions assigned to this class yet. Click &quot;Assign Mission&quot; above to select from the curated catalog.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {classDetails.assigned_missions.map((mission: CatalogMissionItem) => (
                  <div key={mission.id} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700">
                        {mission.category}
                      </span>
                      <span className="text-xs font-medium text-slate-500">
                        {mission.difficulty}
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-900 text-base mb-1">{mission.title}</h3>
                    <p className="text-xs text-slate-600 line-clamp-3 mb-4">{mission.description}</p>
                    <div className="pt-3 border-t border-slate-100 text-xs text-slate-500 flex justify-between">
                      <span>Base Points: <strong className="text-slate-800">{mission.base_points}</strong></span>
                      <span className="text-emerald-600 font-semibold">Active in Class</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Common Mistakes Analytics */}
        {activeTab === "mistakes" && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs text-blue-800 flex items-start space-x-2">
              <Lightbulb className="h-5 w-5 shrink-0 text-blue-600" />
              <span>
                <strong>Deterministic Misconception Detection:</strong> CloudProof analyzes every failed verification click across your students to identify the specific AWS configuration rules where students struggled the most. Use these insights to target review topics during lecture.
              </span>
            </div>

            {!classDetails?.common_mistakes || classDetails.common_mistakes.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500 text-sm">
                No verification failures recorded yet. As students attempt missions and run verification checks, common failure patterns will appear here automatically.
              </div>
            ) : (
              <div className="space-y-3">
                {classDetails.common_mistakes.map((mistake: CommonMistakeItem, index: number) => (
                  <div
                    key={mistake.rule_id}
                    className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex items-center justify-between"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="bg-red-50 text-red-700 font-bold text-xs px-2.5 py-1 rounded-md shrink-0">
                        #{index + 1}
                      </div>
                      <div>
                        <h4 className="font-mono font-bold text-slate-900 text-sm">{mistake.rule_id}</h4>
                        <p className="text-xs text-slate-600 mt-1">{mistake.description}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <span className="text-lg font-bold text-red-600">{mistake.failure_count}</span>
                      <span className="block text-[10px] uppercase font-semibold text-slate-400">Failures</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Assign Mission Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-blue-50 p-2.5 rounded-full text-blue-600">
                <BookOpen className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Assign Incident Mission</h3>
                <p className="text-xs text-slate-500">Select a mission from the curated catalog</p>
              </div>
            </div>

            {assignError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{assignError}</span>
              </div>
            )}

            <form onSubmit={handleAssignMission} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase tracking-wider">
                  Select Mission
                </label>
                <select
                  value={selectedMissionId}
                  onChange={(e) => setSelectedMissionId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {catalog.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.title} ({m.difficulty} - {m.category})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAssignModal(false);
                    setAssignError(null);
                  }}
                  className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAssigning}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-sm transition disabled:opacity-50"
                >
                  {isAssigning ? "Assigning..." : "Assign to Class"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
