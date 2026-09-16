export type InternshipStatus =
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'CHANGES_REQUESTED'
  | 'APPROVED'
  | 'REJECTED'
  | 'CLOSED'
  | 'EXPIRED';

export type CompanyVerificationStatus =
  | 'PENDING'
  | 'VERIFIED'
  | 'REJECTED'
  | 'SUSPENDED';

export type ApplicationStatus =
  | 'APPLIED'
  | 'UNDER_REVIEW'
  | 'SHORTLISTED'
  | 'INTERVIEW'
  | 'SELECTED'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'WITHDRAWN';

export interface ApplicationStatusHistory {
  id: string;
  application_id: string;
  old_status: string | null;
  new_status: ApplicationStatus | string;
  changed_by: string | null;
  changed_by_role: string;
  note: string | null;
  created_at: string;
  changed_by_name?: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  related_entity_type?: string | null;
  related_entity_id?: string | null;
  is_read: boolean;
  created_at: string;
}

export interface Internship {
  id: string;
  company_id: string;
  title: string;
  category: string;
  description: string;
  internship_type: string;
  location: string;
  work_mode: string;
  duration: string;
  stipend: string;
  currency: string;
  is_paid: boolean;
  experience_level?: string | null;
  education?: string | null;
  eligibility?: string | null;
  responsibilities?: string | null;
  benefits?: string | null;
  learning_opportunities?: string | null;
  selection_process?: string | null;
  application_deadline: string;
  status: InternshipStatus;
  created_at: string;
  updated_at: string;
  company_name?: string;
  company_website?: string | null;
  company_location?: string | null;
  company_verification_status?: CompanyVerificationStatus;
  company_description?: string | null;
  company_email?: string | null;
  application_count?: number;
  latest_review_reason?: string | null;
  latest_review_action?: string | null;
}

export interface ProjectItem {
  id?: string;
  title: string;
  description: string;
  technologies: string;
  role?: string;
  duration?: string;
  github_url?: string;
  demo_url?: string;
}

export interface StudentDocument {
  id: string;
  student_id?: string;
  application_id?: string;
  document_type: string;
  original_filename: string;
  stored_filename?: string;
  mime_type: string;
  file_size: number;
  created_at: string;
  updated_at?: string;
}

export interface ProfileCompletionDetails {
  percentage: number;
  breakdown: {
    personal: boolean;
    contact: boolean;
    academic: boolean;
    skills: boolean;
    projects: boolean;
    professional: boolean;
    resume: boolean;
  };
  totalFieldsCount: number;
  completedFieldsCount: number;
}

export interface Application {
  id: string;
  student_id: string;
  internship_id: string;
  status: ApplicationStatus;
  applied_at: string;
  updated_at: string;
  cover_letter?: string | null;
  additional_info?: string | null;
  resume_id?: string | null;
  resume_filename?: string | null;
  resume_file_size?: number | null;
  resume_mime_type?: string | null;
  resume_document?: StudentDocument | null;
  internship_title?: string;
  company_name?: string;
  location?: string;
  stipend?: string;
  work_mode?: string;
  internship_category?: string;
  application_deadline?: string;
  student_name?: string;
  student_email?: string;
  student_phone?: string;
  student_college?: string;
  student_degree?: string;
  student_department?: string;
  student_graduation_year?: number;
  student_cgpa?: string;
  student_skills?: string;
  student_projects?: ProjectItem[] | string;
  status_history?: ApplicationStatusHistory[];
  latest_status_note?: string | null;
}

export interface SavedInternshipItem extends Internship {
  bookmark_id: string;
  bookmarked_at: string;
}

export interface StudentProfile {
  id: string;
  user_id: string;
  username?: string;
  full_name: string;
  email: string;
  phone?: string | null;
  dob?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  college?: string | null;
  degree?: string | null;
  department?: string | null;
  graduation_year?: number | null;
  cgpa?: string | null;
  career_objective?: string | null;
  about_me?: string | null;
  linkedin_url?: string | null;
  github_url?: string | null;
  portfolio_url?: string | null;
  skills?: string | null;
  projects?: ProjectItem[] | string | null;
  resume_url?: string | null;
  resume_document?: StudentDocument | null;
  profile_completion?: ProfileCompletionDetails;
  created_at: string;
  updated_at: string;
}

export interface StudentStats {
  totalApplications: number;
  underReview?: number;
  shortlisted?: number;
  interview?: number;
  selected?: number;
  savedInternships: number;
  pendingApplications: number;
  selectedApplications: number;
}

export interface CompanyDashboardStats {
  totalInternships: number;
  pendingApproval: number;
  approvedInternships: number;
  totalApplications: number;
  underReview: number;
  shortlisted: number;
  interview: number;
  selected: number;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedInternshipsResponse {
  success: boolean;
  data: Internship[];
  pagination: Pagination;
}

export interface InternshipFilters {
  search?: string;
  category?: string;
  location?: string;
  workMode?: string;
  internshipType?: string;
  isPaid?: string | boolean;
  experienceLevel?: string;
  sortBy?: 'deadline' | 'latest' | 'stipend';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface CreateInternshipPayload {
  title: string;
  category: string;
  description: string;
  internship_type: string;
  location: string;
  work_mode: string;
  duration: string;
  stipend: string;
  currency?: string;
  is_paid?: boolean;
  experience_level?: string;
  education?: string;
  eligibility?: string;
  responsibilities?: string;
  benefits?: string;
  learning_opportunities?: string;
  selection_process?: string;
  application_deadline: string;
}

export interface AdminReview {
  id: string;
  internship_id: string;
  admin_id: string;
  action: 'APPROVED' | 'REJECTED' | 'CHANGES_REQUESTED';
  reason: string | null;
  created_at: string;
  admin_username?: string;
  internship_title?: string;
}

export interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  metadata: string | Record<string, any> | null;
  created_at: string;
  username?: string;
}

export interface CompanyItem {
  id: string;
  user_id: string;
  company_name: string;
  description?: string | null;
  website?: string | null;
  email?: string | null;
  location?: string | null;
  verification_status: CompanyVerificationStatus;
  created_at: string;
  updated_at: string;
  internship_count?: number;
  internships?: Internship[];
}

export interface AdminDashboardStats {
  totalInternships: number;
  pendingInternships: number;
  approvedInternships: number;
  rejectedInternships: number;
  changesRequested: number;
  totalCompanies: number;
  pendingCompanies: number;
  verifiedCompanies: number;
  suspendedCompanies: number;
  totalApplications: number;
  recentAuditLogs: AuditLog[];
  pendingInternshipsList: Internship[];
}
