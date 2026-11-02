'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Users,
  GraduationCap,
  Award,
  Download,
  Printer,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  ShieldCheck,
  DollarSign,
  Sparkles,
  BookOpen,
  Filter,
  Eye,
  ChevronRight,
  Info,
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import {
  INITIAL_STUDENT_ROSTER,
  CLASS_MISTAKE_INSIGHTS,
  StudentRecord,
} from '@/features/teacher/data/classroomData';
import { StudentSubmissionModal } from '@/features/teacher/components/StudentSubmissionModal';
import { useUserRole } from '@/context/UserRoleContext';

export default function TeacherDashboardPage() {
  const { setRole } = useUserRole();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'needs-help' | 'in-progress'>('all');
  const [selectedStudent, setSelectedStudent] = useState<StudentRecord | null>(null);
  const [students, setStudents] = useState<StudentRecord[]>(INITIAL_STUDENT_ROSTER);

  // Auto-switch to teacher role when visiting this page
  useEffect(() => {
    setRole('teacher');
  }, [setRole]);

  // Read current student session from localStorage to inject live student progress
  useEffect(() => {
    try {
      const getScore = (missionId: string) => {
        const saved = localStorage.getItem(`cloudproof_session_${missionId}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          return parsed.verificationResult ? (parsed.verificationResult.score as number) : null;
        }
        return null;
      };

      const s3Score = getScore('s3-leaky-bucket');
      const sgScore = getScore('sg-door-open');
      const iamScore = getScore('iam-too-much-power');

      if (s3Score !== null || sgScore !== null || iamScore !== null) {
        const total = (s3Score || 0) + (sgScore || 0) + (iamScore || 0);
        const attempted = [s3Score, sgScore, iamScore].filter((s) => s !== null).length;
        const status =
          attempted === 3 && total === 300
            ? 'completed'
            : total < 70 * attempted
            ? 'needs-help'
            : 'in-progress';

        const currentUserStudent: StudentRecord = {
          id: 'current-user-session',
          name: 'You (Current Student Session)',
          rollNo: 'LOCAL-TEST',
          avatar: '🌟',
          email: 'student.local@univ.edu',
          s3Score,
          sgScore,
          iamScore,
          lastActive: 'Just now',
          status,
          notes: 'Active local flight simulator session evaluated in real time.',
          isCurrentUser: true,
        };

        setStudents([currentUserStudent, ...INITIAL_STUDENT_ROSTER]);
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  // Filtered Students
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchesSearch =
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.rollNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.email.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' ? true : s.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [students, searchTerm, statusFilter]);

  // Calculations for Summary Cards
  const totalStudents = students.length;
  const completedStudents = students.filter((s) => s.status === 'completed').length;
  const needsHelpStudents = students.filter((s) => s.status === 'needs-help').length;
  const completionRate = Math.round((completedStudents / totalStudents) * 100);

  const averageScore = Math.round(
    students.reduce((acc, s) => {
      const scores = [s.s3Score, s.sgScore, s.iamScore].filter((x) => x !== null) as number[];
      if (scores.length === 0) return acc;
      const studentAvg = scores.reduce((a, b) => a + b, 0) / scores.length;
      return acc + studentAvg;
    }, 0) / totalStudents
  );

  // CSV Gradebook Export
  const handleExportCSV = () => {
    const headers = [
      'Roll Number',
      'Student Name',
      'Email',
      'The Leaky Bucket (S3)',
      'Door Left Open (VPC SG)',
      'Too Much Power (IAM)',
      'Total Points (300)',
      'Percentage (%)',
      'Status',
      'Last Active',
    ];

    const rows = students.map((s) => {
      const s3 = s.s3Score !== null ? s.s3Score : 'N/A';
      const sg = s.sgScore !== null ? s.sgScore : 'N/A';
      const iam = s.iamScore !== null ? s.iamScore : 'N/A';
      const total = (s.s3Score || 0) + (s.sgScore || 0) + (s.iamScore || 0);
      const percentage = Math.round((total / 300) * 100);

      return [
        `"${s.rollNo}"`,
        `"${s.name}"`,
        `"${s.email}"`,
        s3,
        sg,
        iam,
        total,
        `${percentage}%`,
        `"${s.status}"`,
        `"${s.lastActive}"`,
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `cloudproof_gradebook_CS302_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-canvas transition-colors">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10 flex-1 w-full space-y-10">
        {/* Course Header Banner */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-8 border-b border-border-subtle">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 border border-primary/20 px-3 py-1 rounded-full">
                Faculty Classroom Dashboard
              </span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-success/10 text-success border border-success/20 flex items-center space-x-1">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>$0.00 AWS Bill Guaranteed</span>
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-text-main tracking-tight mt-2.5">
              CS-302: Cloud Security & Infrastructure
            </h1>
            <p className="mt-1 text-sm text-text-muted">
              Section A &bull; Semester Fall 2026 &bull; Practical Hands-on Simulation Engine
            </p>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleExportCSV}
              className="inline-flex items-center space-x-2 px-4 py-2 text-xs font-bold bg-primary hover:bg-primary-hover text-white rounded-xl shadow-sm transition"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export Gradebook (CSV)</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center space-x-2 px-4 py-2 text-xs font-semibold bg-surface border border-border-subtle hover:bg-surface-secondary text-text-main rounded-xl transition"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print Class Report</span>
            </button>

            <Link
              href="/missions"
              onClick={() => setRole('student')}
              className="inline-flex items-center space-x-2 px-4 py-2 text-xs font-semibold bg-accent/10 hover:bg-accent/20 border border-accent/20 text-accent rounded-xl transition"
            >
              <GraduationCap className="h-3.5 w-3.5" />
              <span>Switch to Student View</span>
            </Link>
          </div>
        </div>

        {/* 4 Summary Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="p-6 rounded-3xl bg-surface border border-border-subtle shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-text-muted block">
                Total Enrolled
              </span>
              <span className="text-3xl font-black text-text-main block mt-1">
                {totalStudents} Students
              </span>
              <span className="text-xs text-text-muted mt-1 block">
                100% active in simulation
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <Users className="h-6 w-6" />
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-surface border border-border-subtle shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-text-muted block">
                Completion Rate
              </span>
              <span className="text-3xl font-black text-text-main block mt-1">
                {completionRate}%
              </span>
              <span className="text-xs text-success font-semibold mt-1 block">
                {completedStudents} of {totalStudents} finished all 3
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-success/10 text-success flex items-center justify-center font-bold">
              <CheckCircle2 className="h-6 w-6" />
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-surface border border-border-subtle shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-text-muted block">
                Class Average
              </span>
              <span className="text-3xl font-black text-primary block mt-1">
                {averageScore} / 100
              </span>
              <span className="text-xs text-text-muted mt-1 block">
                Deterministic programmatic grading
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-accent/10 text-accent flex items-center justify-center font-bold">
              <Award className="h-6 w-6" />
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-surface border border-border-subtle shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-text-muted block">
                Cloud Lab Bill
              </span>
              <span className="text-3xl font-black text-success block mt-1">
                $0.00
              </span>
              <span className="text-xs text-success font-semibold mt-1 block">
                Zero AWS credit card charges
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-success/10 text-success flex items-center justify-center font-bold">
              <DollarSign className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* Student Roster Table Section */}
        <div className="bg-surface border border-border-subtle rounded-3xl shadow-sm overflow-hidden">
          {/* Table Header Controls */}
          <div className="p-6 border-b border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-text-main">
                Student Roster & Lab Records
              </h2>
              <p className="text-xs text-text-muted mt-0.5">
                Track real-time simulation progress and inspect individual submission rubrics.
              </p>
            </div>

            {/* Search & Status Filters */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type="text"
                  placeholder="Search student or roll no..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-2 text-xs rounded-xl bg-canvas border border-border-subtle text-text-main focus:outline-none focus:ring-2 focus:ring-primary w-full sm:w-60"
                />
              </div>

              {/* Status Tabs */}
              <div className="flex items-center p-1 bg-canvas border border-border-subtle rounded-xl text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    statusFilter === 'all'
                      ? 'bg-surface font-bold text-text-main shadow-xs'
                      : 'text-text-muted hover:text-text-main'
                  }`}
                >
                  All ({students.length})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('completed')}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    statusFilter === 'completed'
                      ? 'bg-surface font-bold text-success shadow-xs'
                      : 'text-text-muted hover:text-text-main'
                  }`}
                >
                  Completed ({completedStudents})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('needs-help')}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    statusFilter === 'needs-help'
                      ? 'bg-surface font-bold text-danger shadow-xs'
                      : 'text-text-muted hover:text-text-main'
                  }`}
                >
                  Struggling ({needsHelpStudents})
                </button>
              </div>
            </div>
          </div>

          {/* Table Body */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-canvas/50 border-b border-border-subtle text-[11px] font-bold uppercase tracking-wider text-text-muted">
                <tr>
                  <th className="py-3.5 px-6">Student</th>
                  <th className="py-3.5 px-4 text-center">S3 Storage</th>
                  <th className="py-3.5 px-4 text-center">VPC Firewall</th>
                  <th className="py-3.5 px-4 text-center">IAM Identity</th>
                  <th className="py-3.5 px-4 text-center">Average</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {filteredStudents.map((student) => {
                  const scores = [student.s3Score, student.sgScore, student.iamScore].filter(
                    (s) => s !== null
                  ) as number[];
                  const studentAvg =
                    scores.length > 0
                      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
                      : 0;

                  return (
                    <tr
                      key={student.id}
                      className={`hover:bg-canvas/40 transition ${
                        student.isCurrentUser ? 'bg-primary/5 font-semibold' : ''
                      }`}
                    >
                      {/* Name & Roll No */}
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl shrink-0">{student.avatar}</span>
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-text-main">
                                {student.name}
                              </span>
                              {student.isCurrentUser && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-accent/20 text-accent">
                                  You
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-text-muted font-mono block">
                              {student.rollNo} &bull; {student.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Mission 1 S3 */}
                      <td className="py-4 px-4 text-center">
                        {student.s3Score !== null ? (
                          <span
                            className={`px-2 py-1 rounded-md font-mono font-bold ${
                              student.s3Score === 100
                                ? 'bg-success/10 text-success'
                                : student.s3Score >= 70
                                ? 'bg-warning/10 text-warning'
                                : 'bg-danger/10 text-danger'
                            }`}
                          >
                            {student.s3Score}/100
                          </span>
                        ) : (
                          <span className="text-text-muted italic text-[11px]">&mdash;</span>
                        )}
                      </td>

                      {/* Mission 2 VPC SG */}
                      <td className="py-4 px-4 text-center">
                        {student.sgScore !== null ? (
                          <span
                            className={`px-2 py-1 rounded-md font-mono font-bold ${
                              student.sgScore === 100
                                ? 'bg-success/10 text-success'
                                : student.sgScore >= 70
                                ? 'bg-warning/10 text-warning'
                                : 'bg-danger/10 text-danger'
                            }`}
                          >
                            {student.sgScore}/100
                          </span>
                        ) : (
                          <span className="text-text-muted italic text-[11px]">&mdash;</span>
                        )}
                      </td>

                      {/* Mission 3 IAM */}
                      <td className="py-4 px-4 text-center">
                        {student.iamScore !== null ? (
                          <span
                            className={`px-2 py-1 rounded-md font-mono font-bold ${
                              student.iamScore === 100
                                ? 'bg-success/10 text-success'
                                : student.iamScore >= 70
                                ? 'bg-warning/10 text-warning'
                                : 'bg-danger/10 text-danger'
                            }`}
                          >
                            {student.iamScore}/100
                          </span>
                        ) : (
                          <span className="text-text-muted italic text-[11px]">&mdash;</span>
                        )}
                      </td>

                      {/* Average */}
                      <td className="py-4 px-4 text-center">
                        <span className="font-extrabold text-sm text-text-main font-mono">
                          {studentAvg > 0 ? `${studentAvg}%` : '&mdash;'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 text-center">
                        <span
                          className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                            student.status === 'completed'
                              ? 'bg-success/10 text-success border-success/30'
                              : student.status === 'in-progress'
                              ? 'bg-warning/10 text-warning border-warning/30'
                              : student.status === 'needs-help'
                              ? 'bg-danger/10 text-danger border-danger/30'
                              : 'bg-surface-secondary text-text-muted border-border-subtle'
                          }`}
                        >
                          <span>{student.status.replace('-', ' ')}</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedStudent(student)}
                          className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-surface-secondary hover:bg-canvas text-primary border border-border-subtle transition"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>Inspect</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Common Mistakes & Learning Bottlenecks Section */}
        <div className="bg-surface border border-border-subtle rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-border-subtle">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-accent bg-accent/10 border border-accent/20 px-2.5 py-0.5 rounded-md">
                Classroom Learning Analytics
              </span>
              <h2 className="text-xl font-bold text-text-main mt-2">
                Common Mistakes & Diagnostic Heatmap
              </h2>
              <p className="text-xs text-text-muted mt-0.5">
                Automated diagnostics identify the exact cloud concepts your students are finding difficult.
              </p>
            </div>
            <span className="text-xs text-text-muted flex items-center space-x-1">
              <Info className="h-3.5 w-3.5 text-primary" />
              <span>Evaluated across {totalStudents} student attempts</span>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {CLASS_MISTAKE_INSIGHTS.map((insight) => (
              <div
                key={insight.missionId}
                className="p-5 rounded-2xl bg-canvas border border-border-subtle flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary px-2 py-0.5 rounded bg-primary/10">
                      {insight.service}
                    </span>
                    <span className="text-xs font-extrabold text-danger font-mono">
                      {insight.affectedPercentage}% Affected
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-text-main">
                    {insight.issue}
                  </h3>

                  {/* Progress bar */}
                  <div className="w-full bg-border-subtle/50 h-2 rounded-full my-2.5 overflow-hidden">
                    <div
                      className="bg-danger h-full rounded-full"
                      style={{ width: `${insight.affectedPercentage}%` }}
                    />
                  </div>

                  <p className="text-xs text-text-muted leading-relaxed">
                    {insight.explanation}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-surface border border-border-subtle text-[11px] text-text-main">
                  <span className="font-bold text-primary block mb-0.5 flex items-center space-x-1">
                    <Sparkles className="h-3 w-3" />
                    <span>Faculty Teaching Tip</span>
                  </span>
                  <p className="text-text-muted leading-snug">
                    {insight.teachingRecommendation}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer />

      {/* Student Record Detail Modal */}
      <StudentSubmissionModal
        student={selectedStudent}
        onClose={() => setSelectedStudent(null)}
      />
    </div>
  );
}
