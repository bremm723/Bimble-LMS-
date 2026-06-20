// User & Auth types
export interface User {
  id: number;
  name: string;
  email: string;
  role: "super_admin" | "admin_cabang" | "tutor" | "siswa";
  branch_id: number | null;
  phone: string | null;
  avatar: string | null;
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;
}

export interface Branch {
  id: number;
  name: string;
  address: string;
  phone: string;
  is_active: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  phone?: string;
}

export interface AuthResponse {
  user: User;
}

// Pagination
export interface PaginatedResponse<T> {
  data: T[];
  links: {
    first: string | null;
    last: string | null;
    prev: string | null;
    next: string | null;
  };
  meta: {
    current_page: number;
    from: number;
    last_page: number;
    per_page: number;
    to: number;
    total: number;
  };
}

// LMS types
export interface Course {
  id: number;
  title: string;
  description: string;
  subject: string;
  level: string;
  branch_id: number;
  tutor_id: number;
  status: "draft" | "published" | "archived";
  thumbnail: string | null;
  tutor?: User;
  chapters?: Chapter[];
  created_at: string;
  updated_at: string;
}

export interface Chapter {
  id: number;
  course_id: number;
  title: string;
  sort_order: number;
  materials?: Material[];
}

export type MaterialType = "video" | "audio" | "text" | "image" | "link";

export interface Material {
  id: number;
  chapter_id: number;
  type: MaterialType;
  title: string;
  content: string | null;
  embed_url: string | null;
  sort_order: number;
  status: "draft" | "published";
  scheduled_at: string | null;
  completed?: boolean;
}

export interface CourseEnrollment {
  id: number;
  user_id: number;
  course_id: number;
  enrolled_at: string;
  progress_pct: number;
  user?: User;
  course?: Course;
}

// Exam types
export type QuestionType =
  | "single_choice"
  | "multi_choice"
  | "true_false"
  | "essay"
  | "matching"
  | "ordering"
  | "agree_disagree";

export interface Question {
  id: number;
  bank_id: number;
  type: QuestionType;
  content: string;
  options: Record<string, unknown>;
  correct_answer: Record<string, unknown>;
  partial_scoring: boolean;
  points: number;
  explanation: string | null;
}

export interface QuestionBank {
  id: number;
  subject: string;
  difficulty: "easy" | "medium" | "hard";
  tags: string[];
  questions?: Question[];
}

export interface Exam {
  id: number;
  title: string;
  course_id: number | null;
  event_id: number | null;
  duration_mins: number;
  max_attempts: number;
  shuffle_questions: boolean;
  shuffle_options: boolean;
  start_at: string;
  end_at: string;
  status: "draft" | "published" | "closed";
  questions?: Question[];
}

export interface ExamAttempt {
  id: number;
  exam_id: number;
  user_id: number;
  attempt_number: number;
  started_at: string;
  submitted_at: string | null;
  score: number | null;
  status: "in_progress" | "submitted" | "graded";
  answers?: ExamAnswer[];
}

export interface ExamAnswer {
  id: number;
  attempt_id: number;
  question_id: number;
  answer: Record<string, unknown>;
  score: number | null;
  graded_by: number | null;
  graded_at: string | null;
}

// Finance types
export interface PaymentScheme {
  id: number;
  name: string;
  type: "monthly" | "package" | "once";
  amount: number;
  meeting_count: number | null;
}

export interface Invoice {
  id: number;
  user_id: number;
  scheme_id: number;
  amount: number;
  due_date: string;
  status: "unpaid" | "paid" | "overdue";
  paid_at: string | null;
  user?: User;
  scheme?: PaymentScheme;
  payments?: Payment[];
}

export interface Payment {
  id: number;
  invoice_id: number;
  amount: number;
  method: "gateway" | "manual";
  proof_image: string | null;
  verification_status: "pending" | "verified" | "rejected";
  verified_by: number | null;
  verified_at: string | null;
  transaction_ref: string | null;
}

// Event types
export interface Event {
  id: number;
  title: string;
  description: string;
  price: number;
  quota: number;
  start_at: string;
  end_at: string;
  exam_id: number | null;
  certificate_template_id: number | null;
  passing_grade: number | null;
  banner_image: string | null;
  registrations_count?: number;
}

export interface EventRegistration {
  id: number;
  event_id: number;
  user_id: number;
  payment_id: number | null;
  status: "pending" | "confirmed" | "cancelled";
}

// Certificate types
export interface CertificateTemplate {
  id: number;
  name: string;
  background_image: string;
  placeholders: Record<string, { x: number; y: number; size: number; font: string }>;
}

export interface Certificate {
  id: number;
  template_id: number;
  user_id: number;
  event_id: number | null;
  course_id: number | null;
  code: string;
  qr_code: string;
  issued_at: string;
  data: Record<string, string>;
}
