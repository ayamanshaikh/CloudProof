const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: "student" | "instructor";
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("cp_token") : null;
  
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorDetail = "An unexpected error occurred";
    try {
      const data = await response.json();
      errorDetail = data.detail || errorDetail;
    } catch {
      // ignore JSON parse failure
    }
    throw new ApiError(errorDetail, response.status);
  }

  return response.json();
}

export interface EnrolledClassSummary {
  id: string;
  name: string;
  description?: string;
  instructor_name: string;
  enrolled_at: string;
}

export interface AssignedMissionItem {
  assignment_id: string;
  mission_id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  base_points: number;
  class_id: string;
  class_name: string;
  due_date?: string;
  status: "not_started" | "in_progress" | "passed" | "failed";
  attempt_id?: string;
  final_score?: number;
  completed_at?: string;
}

export interface StudentDashboardResponse {
  student_id: string;
  full_name: string;
  email: string;
  stats: {
    missions_assigned: number;
    missions_completed: number;
    average_score: number;
    hint_tokens_balance: number;
  };
  enrolled_classes: EnrolledClassSummary[];
  assigned_missions: AssignedMissionItem[];
}

export interface ClassSummaryItem {
  id: string;
  name: string;
  description?: string;
  join_code: string;
  student_count: number;
  mission_count: number;
  created_at: string;
}

export interface CatalogMissionItem {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  base_points: number;
}

export interface InstructorDashboardResponse {
  instructor_id: string;
  full_name: string;
  email: string;
  total_classes: number;
  total_students: number;
  total_assigned_missions: number;
  classes: ClassSummaryItem[];
}

export interface RosterStudentItem {
  id: string;
  full_name: string;
  email: string;
  enrolled_at: string;
  missions_completed: number;
  average_score?: number;
}

export interface StudentProgressItem {
  student_id: string;
  student_name: string;
  student_email: string;
  assignment_id: string;
  mission_title: string;
  status: "not_started" | "in_progress" | "passed" | "failed";
  final_score?: number;
  hints_used: number;
  completed_at?: string;
}

export interface CommonMistakeItem {
  rule_id: string;
  severity: string;
  failure_count: number;
  description: string;
}

export interface ClassDetailResponse {
  id: string;
  name: string;
  description?: string;
  join_code: string;
  created_at: string;
  students: RosterStudentItem[];
  assigned_missions: CatalogMissionItem[];
  progress_matrix: StudentProgressItem[];
  common_mistakes: CommonMistakeItem[];
}

export interface RuleResultItem {
  rule_id: string;
  name: string;
  status: "PASS" | "FAIL" | "ERROR";
  severity: string;
  expected: any;
  actual: any;
  evidence: string;
  points_earned: number;
  max_points: number;
}

export interface VerificationVerdictItem {
  mission_slug: string;
  status: "PASS" | "FAIL" | "ERROR";
  total_rules: number;
  passed_rules: number;
  base_points_earned: number;
  max_points_possible: number;
  rule_results: RuleResultItem[];
  execution_time_ms: number;
}

export interface AttemptStateResponse {
  attempt_id: string;
  assignment_id: string;
  mission_slug: string;
  mission_title: string;
  mode: string;
  status: string;
  current_demo_state: any;
  started_at: string;
  base_score: number;
  penalty_score: number;
  final_score: number;
}

export interface VerifyAttemptResponse {
  verdict: VerificationVerdictItem;
  attempt_id: string;
  status: string;
  base_score: number;
  penalty_score: number;
  final_score: number;
  completed_at?: string;
}

export const api = {
  // Auth
  register: (payload: { email: string; password: string; full_name: string; role: "student" | "instructor" }) =>
    request<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  login: (payload: { email: string; password: string }) =>
    request<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  getMe: () => request<User>("/auth/me"),

  // Student
  getStudentDashboard: () => request<StudentDashboardResponse>("/student/dashboard"),
  joinClass: (join_code: string) =>
    request<EnrolledClassSummary>("/student/classes/join", {
      method: "POST",
      body: JSON.stringify({ join_code }),
    }),

  // Instructor
  getInstructorDashboard: () => request<InstructorDashboardResponse>("/instructor/dashboard"),
  createClass: (payload: { name: string; description?: string }) =>
    request<ClassSummaryItem>("/instructor/classes", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  getClassDetails: (classId: string) => request<ClassDetailResponse>(`/instructor/classes/${classId}`),
  getMissionCatalog: () => request<CatalogMissionItem[]>("/instructor/missions/catalog"),
  assignMission: (classId: string, payload: { mission_id: string; due_date?: string }) =>
    request<{ message: string; assignment_id: string }>(`/instructor/classes/${classId}/assign`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  exportClassGradesCsv: async (classId: string) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("cloudproof_token") : null;
    const res = await fetch(`${API_BASE_URL}/instructor/classes/${classId}/export`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (!res.ok) {
      throw new Error(`Failed to export grades (HTTP ${res.status})`);
    }
    return await res.blob();
  },

  // Verification & Missions
  startMission: (assignmentId: string, payload: { mode?: string; aws_account_id?: string } = {}) =>
    request<AttemptStateResponse>(`/missions/${assignmentId}/start`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateDemoState: (attemptId: string, demo_state: any) =>
    request<{ message: string }>(`/missions/${attemptId}/state`, {
      method: "PUT",
      body: JSON.stringify({ demo_state }),
    }),
  verifyAttempt: (attemptId: string) =>
    request<VerifyAttemptResponse>(`/missions/${attemptId}/verify`, {
      method: "POST",
    }),

  // Hints
  getHintStatus: (attemptId: string) => request<HintAttemptStatusResponse>(`/hints/attempt/${attemptId}`),
  unlockHint: (attemptId: string, hint_level: number) =>
    request<UnlockHintResponse>(`/hints/attempt/${attemptId}/unlock`, {
      method: "POST",
      body: JSON.stringify({ hint_level }),
    }),

  // AI Post-Mortem
  getPostMortem: (attemptId: string) => request<PostMortemResponse>(`/postmortem/attempt/${attemptId}`),

  // Student Portfolio & Certifications
  getStudentPortfolio: () => request<StudentPortfolioResponse>("/student/portfolio"),
};

export interface PostMortemResponse {
  attempt_id: string;
  mission_title: string;
  verdict_status: string;
  incident_summary: string;
  root_cause_analysis: string;
  threat_exploit_scenario: string;
  remediation_diff_breakdown: string;
  why_fix_works: string;
  best_practices: string[];
  generated_by: string;
  created_at: string;
}

export interface HintItemResponse {
  id: string;
  level: number;
  title: string;
  token_cost: number;
  penalty_percent: number;
  is_unlocked: boolean;
  content?: string;
}

export interface HintAttemptStatusResponse {
  attempt_id: string;
  mission_id: string;
  wallet_balance: number;
  total_penalty_percent: number;
  hints: HintItemResponse[];
}

export interface UnlockHintResponse {
  message: string;
  hint_level: number;
  tokens_spent: number;
  new_wallet_balance: number;
  penalty_applied: number;
  total_penalty_percent: number;
  unlocked_content: string;
}

export interface CompetencyScore {
  domain: string;
  level: "Mastered" | "Proficient" | "In Progress" | "Unattempted";
  score_percent: number;
  verified_rules_count: number;
  summary: string;
}

export interface CertificationBadge {
  badge_id: string;
  title: string;
  issuer: string;
  verification_token: string;
  is_earned: boolean;
  earned_at?: string;
  required_missions: string[];
}

export interface CompletedMissionRecord {
  mission_title: string;
  slug: string;
  category: string;
  final_score: number;
  base_score: number;
  penalty_score: number;
  mode: string;
  completed_at: string;
  attempt_id: string;
}

export interface StudentPortfolioResponse {
  student_id: string;
  full_name: string;
  email: string;
  total_completed: number;
  overall_average_score: number;
  competencies: CompetencyScore[];
  badge: CertificationBadge;
  history: CompletedMissionRecord[];
}
