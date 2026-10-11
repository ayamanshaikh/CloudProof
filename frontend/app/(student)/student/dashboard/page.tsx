"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { api, StudentDashboardResponse, AssignedMissionItem } from "@/lib/api";
import {
  ShieldCheck,
  Coins,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  BookOpen,
  LogOut,
  Plus,
  School,
  Clock,
  Award
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function StudentDashboardPage() {
  const { user, logout, isStudent, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [dashboard, setDashboard] = useState<StudentDashboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Join class modal state
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [joinError, setJoinError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "student")) {
      router.push("/login");
      return;
    }

    if (user && user.role === "student") {
      fetchDashboardData();
    }
  }, [user, authLoading, router]);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await api.getStudentDashboard();
      setDashboard(data);
    } catch (err: any) {
      setError(err.message || "Failed to load dashboard data.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;

    try {
      setIsJoining(true);
      setJoinError(null);
      await api.joinClass(joinCode.trim());
      setShowJoinModal(false);
      setJoinCode("");
      await fetchDashboardData();
    } catch (err: any) {
      setJoinError(err.message || "Failed to join class. Please check the code.");
    } finally {
      setIsJoining(false);
    }
  };

  if (authLoading || (isLoading && !dashboard)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-slate-600">Loading student workspace...</p>
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
            <div className="bg-blue-600 text-white p-1.5 rounded-lg">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <span className="font-bold text-lg text-slate-900 tracking-tight">CloudProof</span>
              <span className="ml-2 text-xs font-semibold px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full">
                Student
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              href="/student/portfolio"
              className="flex items-center space-x-1.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-800 px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm transition"
              title="View Verified Skills Portfolio & Certification Badge"
            >
              <Award className="h-4 w-4 text-indigo-600" />
              <span>Skills Portfolio</span>
            </Link>

            {/* Virtual Hint Balance Pill */}
            <div
              className="flex items-center space-x-1.5 bg-amber-50 border border-amber-200 text-amber-800 px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm"
              title="Daily Virtual Hint Tokens (used to unlock hints during missions)"
            >
              <Coins className="h-4 w-4 text-amber-600" />
              <span>Hint Tokens:</span>
              <span className="font-bold text-amber-950">
                {dashboard?.stats.hint_tokens_balance ?? 10}/10
              </span>
            </div>

            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-slate-900">{user?.full_name}</p>
              <p className="text-xs text-slate-500">{user?.email}</p>
            </div>

            <button
              onClick={logout}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
              title="Sign Out"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto w-full px-6 py-8 flex-1">
        {/* Welcome & Stats Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Welcome back, {user?.full_name?.split(" ")[0]}!
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Select an assigned incident mission below to investigate and remediate.
            </p>
          </div>

          <button
            onClick={() => setShowJoinModal(true)}
            className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium shadow-sm transition"
          >
            <Plus className="h-4 w-4" />
            <span>Join a Class</span>
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-3 text-sm text-red-700">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Assigned Missions
              </span>
              <BookOpen className="h-5 w-5 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900 mt-2">
              {dashboard?.stats.missions_assigned ?? 0}
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Completed
              </span>
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900 mt-2">
              {dashboard?.stats.missions_completed ?? 0}
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Average Score
              </span>
              <Award className="h-5 w-5 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900 mt-2">
              {dashboard?.stats.average_score ? `${Math.round(dashboard.stats.average_score)}%` : "N/A"}
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Hint Tokens Available
              </span>
              <Coins className="h-5 w-5 text-amber-500" />
            </div>
            <p className="text-2xl font-bold text-slate-900 mt-2">
              {dashboard?.stats.hint_tokens_balance ?? 10} / 10
            </p>
          </div>
        </div>

        {/* Assigned Missions Section */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900">Your Assigned Incident Missions</h2>
          </div>

          {!dashboard?.assigned_missions || dashboard.assigned_missions.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
              <School className="h-10 w-10 text-slate-400 mx-auto mb-3" />
              <h3 className="font-semibold text-slate-800">No active assignments yet</h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto mt-1 mb-4">
                Join a class using the code provided by your professor to unlock your hands-on cloud troubleshooting missions.
              </p>
              <button
                onClick={() => setShowJoinModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
              >
                Enter Class Join Code
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {dashboard.assigned_missions.map((mission: AssignedMissionItem) => (
                <div
                  key={mission.assignment_id}
                  className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow transition flex flex-col justify-between overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {mission.category}
                      </span>
                      <span
                        className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                          mission.status === "passed"
                            ? "bg-emerald-100 text-emerald-800"
                            : mission.status === "in_progress"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {mission.status === "passed"
                          ? "COMPLETED"
                          : mission.status === "in_progress"
                          ? "IN PROGRESS"
                          : "NOT STARTED"}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 mb-2">{mission.title}</h3>
                    <p className="text-sm text-slate-600 line-clamp-3 mb-4">{mission.description}</p>

                    <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100">
                      <span>Difficulty: <strong className="text-slate-700">{mission.difficulty}</strong></span>
                      <span>Base Points: <strong className="text-slate-700">{mission.base_points}</strong></span>
                    </div>
                  </div>

                  <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                    <div className="text-xs text-slate-500">
                      Class: <strong className="text-slate-800">{mission.class_name}</strong>
                    </div>

                    <Link
                      href={`/student/missions/${mission.assignment_id}`}
                      className={`inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition ${
                        mission.status === "passed"
                          ? "bg-slate-200 hover:bg-slate-300 text-slate-800"
                          : "bg-blue-600 hover:bg-blue-700 text-white"
                      }`}
                    >
                      {mission.status === "passed" ? (
                        <>
                          <RotateCcw className="h-3.5 w-3.5" />
                          <span>Review Fix</span>
                        </>
                      ) : (
                        <>
                          <Play className="h-3.5 w-3.5" />
                          <span>Investigate</span>
                        </>
                      )}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Enrolled Classes List */}
        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-4">Enrolled Classes</h2>
          {!dashboard?.enrolled_classes || dashboard.enrolled_classes.length === 0 ? (
            <p className="text-sm text-slate-500">You are not enrolled in any classes yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {dashboard.enrolled_classes.map((cls) => (
                <div key={cls.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-slate-900">{cls.name}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">Instructor: {cls.instructor_name}</p>
                    </div>
                    <School className="h-5 w-5 text-blue-600 shrink-0" />
                  </div>
                  {cls.description && (
                    <p className="text-xs text-slate-600 mt-2 line-clamp-2">{cls.description}</p>
                  )}
                  <p className="text-[11px] text-slate-400 mt-3 flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>Enrolled: {new Date(cls.enrolled_at).toLocaleDateString()}</span>
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Join Class Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-blue-50 p-2.5 rounded-full text-blue-600">
                <School className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Join a Class</h3>
                <p className="text-xs text-slate-500">Enter the join code given by your instructor</p>
              </div>
            </div>

            {joinError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{joinError}</span>
              </div>
            )}

            <form onSubmit={handleJoinClass} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase tracking-wider">
                  Class Join Code
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CP-9X28K"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowJoinModal(false);
                    setJoinError(null);
                  }}
                  className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isJoining}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-sm transition disabled:opacity-50"
                >
                  {isJoining ? "Joining..." : "Join Class"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
