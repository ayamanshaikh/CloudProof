'use client';

import React from 'react';
import { StudentRecord } from '../data/classroomData';
import {
  X,
  Award,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Mail,
  User,
  ShieldCheck,
  BookOpen,
} from 'lucide-react';

interface Props {
  student: StudentRecord | null;
  onClose: () => void;
}

export function StudentSubmissionModal({ student, onClose }: Props) {
  if (!student) return null;

  const missions = [
    {
      id: 's3',
      name: 'The Leaky Bucket',
      category: 'Storage Security (S3)',
      score: student.s3Score,
      pointsMax: 100,
    },
    {
      id: 'sg',
      name: 'Door Left Open',
      category: 'Network Security (VPC SG)',
      score: student.sgScore,
      pointsMax: 100,
    },
    {
      id: 'iam',
      name: 'Too Much Power',
      category: 'Identity & Access (IAM)',
      score: student.iamScore,
      pointsMax: 100,
    },
  ];

  const totalEarned =
    (student.s3Score || 0) + (student.sgScore || 0) + (student.iamScore || 0);
  const attemptedCount = [student.s3Score, student.sgScore, student.iamScore].filter(
    (s) => s !== null
  ).length;
  const averageScore = attemptedCount > 0 ? Math.round(totalEarned / attemptedCount) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface border border-border-subtle rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-text-muted hover:text-text-main hover:bg-surface-secondary transition"
          title="Close modal"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Student Profile Header */}
        <div className="flex items-start space-x-4 pb-6 border-b border-border-subtle">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center text-3xl shrink-0">
            {student.avatar}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-bold text-text-main truncate">
                {student.name}
              </h2>
              {student.isCurrentUser && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20">
                  Current Session
                </span>
              )}
            </div>
            <p className="text-xs text-text-muted mt-0.5 flex items-center space-x-2">
              <span className="font-mono font-semibold">{student.rollNo}</span>
              <span>&bull;</span>
              <span>{student.email}</span>
            </p>
            <div className="mt-2 flex items-center space-x-2">
              <span
                className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                  student.status === 'completed'
                    ? 'bg-success/10 text-success border-success/30'
                    : student.status === 'in-progress'
                    ? 'bg-warning/10 text-warning border-warning/30'
                    : student.status === 'needs-help'
                    ? 'bg-danger/10 text-danger border-danger/30'
                    : 'bg-surface-secondary text-text-muted border-border-subtle'
                }`}
              >
                {student.status === 'completed'
                  ? 'All Labs Completed'
                  : student.status === 'in-progress'
                  ? 'In Progress'
                  : student.status === 'needs-help'
                  ? 'Needs Assistance'
                  : 'Unattempted'}
              </span>
              <span className="text-xs text-text-muted flex items-center space-x-1">
                <Clock className="h-3 w-3" />
                <span>Active {student.lastActive}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-3 gap-3 my-6">
          <div className="p-3.5 rounded-2xl bg-canvas border border-border-subtle text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted block">
              Average Score
            </span>
            <span className="text-xl font-extrabold text-primary block mt-0.5">
              {averageScore} / 100
            </span>
          </div>
          <div className="p-3.5 rounded-2xl bg-canvas border border-border-subtle text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted block">
              Labs Finished
            </span>
            <span className="text-xl font-extrabold text-text-main block mt-0.5">
              {attemptedCount} / 3
            </span>
          </div>
          <div className="p-3.5 rounded-2xl bg-canvas border border-border-subtle text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted block">
              Total Points
            </span>
            <span className="text-xl font-extrabold text-success block mt-0.5">
              {totalEarned} / 300
            </span>
          </div>
        </div>

        {/* Lab Breakdown */}
        <div className="space-y-3 mb-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted">
            Individual Mission Submissions
          </h3>
          {missions.map((m) => {
            const hasAttempt = m.score !== null;
            const isPassed = m.score === 100;
            const isPartial = m.score !== null && m.score > 0 && m.score < 100;
            return (
              <div
                key={m.id}
                className="p-3.5 rounded-2xl bg-surface-secondary/40 border border-border-subtle flex items-center justify-between"
              >
                <div>
                  <span className="font-bold text-xs text-text-main block">
                    {m.name}
                  </span>
                  <span className="text-[11px] text-text-muted block">
                    {m.category}
                  </span>
                </div>
                <div>
                  {hasAttempt ? (
                    <div className="flex items-center space-x-2">
                      <span
                        className={`text-xs font-mono font-bold px-2 py-0.5 rounded-lg ${
                          isPassed
                            ? 'bg-success/10 text-success'
                            : isPartial
                            ? 'bg-warning/10 text-warning'
                            : 'bg-danger/10 text-danger'
                        }`}
                      >
                        {m.score} / {m.pointsMax}
                      </span>
                      {isPassed ? (
                        <CheckCircle2 className="h-4 w-4 text-success" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-warning" />
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-text-muted italic">
                      Not Attempted
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Instructor Notes */}
        {student.notes && (
          <div className="p-3.5 rounded-2xl bg-primary/5 border border-primary/20 text-xs">
            <span className="font-bold text-primary block mb-0.5 flex items-center space-x-1.5">
              <BookOpen className="h-3.5 w-3.5" />
              <span>Diagnostic Observations</span>
            </span>
            <p className="text-text-muted text-[11px] leading-relaxed">
              {student.notes}
            </p>
          </div>
        )}

        {/* Footer Action */}
        <div className="mt-6 pt-5 border-t border-border-subtle flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-surface-secondary hover:bg-canvas text-text-main border border-border-subtle transition"
          >
            Close Record
          </button>
        </div>
      </div>
    </div>
  );
}
