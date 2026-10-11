"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { api, InstructorDashboardResponse, ClassSummaryItem } from "@/lib/api";
import {
  ShieldCheck,
  School,
  Users,
  BookOpen,
  Plus,
  LogOut,
  Copy,
  Check,
  ArrowRight,
  AlertTriangle,
  FolderPlus
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function InstructorDashboardPage() {
  const { user, logout, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [dashboard, setDashboard] = useState<InstructorDashboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create class modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [className, setClassName] = useState("");
  const [classDesc, setClassDesc] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "instructor")) {
      router.push("/login");
      return;
    }

    if (user && user.role === "instructor") {
      fetchDashboard();
    }
  }, [user, authLoading, router]);

  const fetchDashboard = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await api.getInstructorDashboard();
      setDashboard(data);
    } catch (err: any) {
      setError(err.message || "Failed to load instructor dashboard.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!className.trim()) return;

    try {
      setIsCreating(true);
      await api.createClass({
        name: className.trim(),
        description: classDesc.trim() || undefined,
      });
      setShowCreateModal(false);
      setClassName("");
      setClassDesc("");
      await fetchDashboard();
    } catch (err: any) {
      setError(err.message || "Failed to create class.");
    } finally {
      setIsCreating(false);
    }
  };

  const copyJoinCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  if (authLoading || (isLoading && !dashboard)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-slate-600">Loading instructor dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
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

          <div className="flex items-center space-x-4">
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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto w-full px-6 py-8 flex-1">
        {/* Title & Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Instructor Control Center</h1>
            <p className="text-sm text-slate-600 mt-1">
              Manage your course sections, assign cloud incident missions, and monitor class progress.
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium shadow-sm transition"
          >
            <Plus className="h-4 w-4" />
            <span>Create New Class</span>
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-3 text-sm text-red-700">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Aggregate Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total Classes
              </span>
              <School className="h-5 w-5 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900 mt-2">{dashboard?.total_classes ?? 0}</p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Enrolled Students
              </span>
              <Users className="h-5 w-5 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900 mt-2">{dashboard?.total_students ?? 0}</p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Active Assignments
              </span>
              <BookOpen className="h-5 w-5 text-emerald-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900 mt-2">
              {dashboard?.total_assigned_missions ?? 0}
            </p>
          </div>
        </div>

        {/* Classes List */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900">Your Classes</h2>
          </div>

          {!dashboard?.classes || dashboard.classes.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
              <FolderPlus className="h-10 w-10 text-slate-400 mx-auto mb-3" />
              <h3 className="font-semibold text-slate-800">No classes created yet</h3>
              <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                Create your first class to generate a join code and assign practical cloud incident missions to students.
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
              >
                Create First Class
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {dashboard.classes.map((c: ClassSummaryItem) => (
                <div
                  key={c.id}
                  className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow transition flex flex-col justify-between overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-slate-900 text-base">{c.name}</h3>
                    </div>

                    {c.description && (
                      <p className="text-xs text-slate-600 mb-4 line-clamp-2">{c.description}</p>
                    )}

                    {/* Join Code Box */}
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 flex items-center justify-between mb-4">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                          Class Join Code
                        </span>
                        <span className="text-sm font-mono font-bold text-blue-600 tracking-wide">
                          {c.join_code}
                        </span>
                      </div>
                      <button
                        onClick={() => copyJoinCode(c.join_code)}
                        className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded hover:bg-slate-50 flex items-center space-x-1 transition"
                        title="Copy Join Code to share with students"
                      >
                        {copiedCode === c.join_code ? (
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

                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 pt-2 border-t border-slate-100">
                      <div>
                        Students: <strong className="text-slate-800">{c.student_count}</strong>
                      </div>
                      <div>
                        Missions: <strong className="text-slate-800">{c.mission_count}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
                    <Link
                      href={`/instructor/classes/${c.id}`}
                      className="inline-flex items-center space-x-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 transition"
                    >
                      <span>Manage Roster & Analytics</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Create Class Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-blue-50 p-2.5 rounded-full text-blue-600">
                <School className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Create a New Class</h3>
                <p className="text-xs text-slate-500">Students will join using an auto-generated code</p>
              </div>
            </div>

            <form onSubmit={handleCreateClass} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase tracking-wider">
                  Class Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CS401 Cloud Infrastructure Fall 2026"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase tracking-wider">
                  Description (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Incident response lab section for undergraduate seniors"
                  value={classDesc}
                  onChange={(e) => setClassDesc(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-sm transition disabled:opacity-50"
                >
                  {isCreating ? "Creating..." : "Create Class"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
