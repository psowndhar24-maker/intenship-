import { query } from '../db/index.js';
import { StudentProfile, ProjectItem, StudentDocument, ProfileCompletionDetails } from '../types/index.js';

export interface UpdateStudentProfileInput {
  full_name?: string;
  email?: string;
  phone?: string;
  dob?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  college?: string;
  degree?: string;
  department?: string;
  graduation_year?: number;
  cgpa?: string;
  career_objective?: string;
  about_me?: string;
  linkedin_url?: string;
  github_url?: string;
  portfolio_url?: string;
  skills?: string;
  projects?: ProjectItem[] | string;
  resume_url?: string;
}

export function calculateProfileCompletion(
  profile: any,
  resumeDoc: StudentDocument | null
): ProfileCompletionDetails {
  // Breakdown flags
  const hasFullName = Boolean(profile.full_name && profile.full_name.trim());
  const hasDOB = Boolean(profile.dob && profile.dob.trim());
  const hasAddress = Boolean(profile.address && profile.address.trim());
  const hasCity = Boolean(profile.city && profile.city.trim());
  const hasState = Boolean(profile.state && profile.state.trim());
  const hasCountry = Boolean(profile.country && profile.country.trim());
  const isPersonalComplete = hasFullName && (hasDOB || hasCity || hasCountry);

  const hasEmail = Boolean(profile.email && profile.email.trim());
  const hasPhone = Boolean(profile.phone && profile.phone.trim());
  const isContactComplete = hasEmail && hasPhone;

  const hasCollege = Boolean(profile.college && profile.college.trim());
  const hasDegree = Boolean(profile.degree && profile.degree.trim());
  const hasDepartment = Boolean(profile.department && profile.department.trim());
  const hasGradYear = Boolean(profile.graduation_year);
  const hasCGPA = Boolean(profile.cgpa && profile.cgpa.trim());
  const isAcademicComplete = hasCollege && hasDegree;

  const hasSkills = Boolean(profile.skills && profile.skills.trim());

  let hasProjects = false;
  if (Array.isArray(profile.projects)) {
    hasProjects = profile.projects.length > 0;
  } else if (typeof profile.projects === 'string' && profile.projects.trim()) {
    try {
      const parsed = JSON.parse(profile.projects);
      hasProjects = Array.isArray(parsed) && parsed.length > 0;
    } catch {
      hasProjects = profile.projects.trim().length > 5;
    }
  }

  const hasCareerObjective = Boolean(
    (profile.career_objective && profile.career_objective.trim()) ||
    (profile.about_me && profile.about_me.trim())
  );
  const hasProfessionalLinks = Boolean(
    (profile.linkedin_url && profile.linkedin_url.trim()) ||
    (profile.github_url && profile.github_url.trim()) ||
    (profile.portfolio_url && profile.portfolio_url.trim())
  );
  const isProfessionalComplete = hasCareerObjective || hasProfessionalLinks;

  const hasResume = Boolean(resumeDoc || (profile.resume_url && profile.resume_url.trim()));

  // Point weights (total = 100)
  // Personal (20)
  let score = 0;
  if (hasFullName) score += 6;
  if (hasDOB) score += 3;
  if (hasAddress) score += 3;
  if (hasCity) score += 3;
  if (hasState) score += 2;
  if (hasCountry) score += 3;

  // Contact (10)
  if (hasEmail) score += 5;
  if (hasPhone) score += 5;

  // Academic (20)
  if (hasCollege) score += 5;
  if (hasDegree) score += 5;
  if (hasDepartment) score += 4;
  if (hasGradYear) score += 3;
  if (hasCGPA) score += 3;

  // Skills (15)
  if (hasSkills) score += 15;

  // Projects (15)
  if (hasProjects) score += 15;

  // Professional (10)
  if (hasCareerObjective) score += 5;
  if (hasProfessionalLinks) score += 5;

  // Resume (10)
  if (hasResume) score += 10;

  const percentage = Math.min(100, Math.max(0, Math.round(score)));

  const fields = [
    hasFullName, hasEmail, hasPhone, hasDOB, hasAddress, hasCity,
    hasCollege, hasDegree, hasDepartment, hasGradYear, hasCGPA,
    hasSkills, hasProjects, hasCareerObjective, hasProfessionalLinks, hasResume
  ];
  const completedFieldsCount = fields.filter(Boolean).length;

  return {
    percentage,
    breakdown: {
      personal: isPersonalComplete,
      contact: isContactComplete,
      academic: isAcademicComplete,
      skills: hasSkills,
      projects: hasProjects,
      professional: isProfessionalComplete,
      resume: hasResume,
    },
    totalFieldsCount: fields.length,
    completedFieldsCount,
  };
}

export class StudentService {
  public static async getProfile(userId: string): Promise<StudentProfile> {
    const querySql = `
      SELECT sp.*, u.username
      FROM student_profiles sp
      LEFT JOIN users u ON sp.user_id = u.id
      WHERE sp.user_id = $1 
      LIMIT 1
    `;

    let result = await query<any>(querySql, [userId]);

    if (result.rows.length === 0) {
      // Create default profile for student user if not yet initialized
      const id = `prof_${userId.replace('usr_', '')}`;
      await query(
        `INSERT INTO student_profiles (id, user_id, full_name, email)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (id) DO NOTHING`,
        [id, userId, 'Student Candidate', `${userId}@campus.internhub.edu`]
      );

      result = await query<any>(querySql, [userId]);
    }

    const row = result.rows[0];

    // Query active resume document
    const resumeRes = await query<StudentDocument>(
      `SELECT id, student_id, document_type, original_filename, stored_filename, mime_type, file_size, created_at, updated_at
       FROM student_documents 
       WHERE student_id = $1 AND document_type = 'RESUME' 
       ORDER BY created_at DESC LIMIT 1`,
      [row.id]
    );
    const resumeDoc = resumeRes.rows.length > 0 ? resumeRes.rows[0] : null;

    // Parse projects JSON if stored as string
    let parsedProjects: ProjectItem[] = [];
    if (row.projects) {
      if (typeof row.projects === 'string') {
        try {
          parsedProjects = JSON.parse(row.projects);
        } catch {
          parsedProjects = [];
        }
      } else if (Array.isArray(row.projects)) {
        parsedProjects = row.projects;
      }
    }

    const profileData: StudentProfile = {
      ...row,
      projects: parsedProjects,
      resume_document: resumeDoc,
      profile_completion: calculateProfileCompletion(
        { ...row, projects: parsedProjects },
        resumeDoc
      ),
    };

    return profileData;
  }

  public static async updateProfile(
    userId: string,
    input: UpdateStudentProfileInput
  ): Promise<StudentProfile> {
    // Ensure profile exists
    const existing = await this.getProfile(userId);

    // Format projects to JSON string if passed as array
    let formattedProjects: string | null = null;
    if (input.projects !== undefined) {
      if (typeof input.projects === 'string') {
        formattedProjects = input.projects.trim() || null;
      } else {
        formattedProjects = JSON.stringify(input.projects || []);
      }
    }

    const updateSql = `
      UPDATE student_profiles SET
        full_name = COALESCE($1, full_name),
        phone = COALESCE($2, phone),
        dob = COALESCE($3, dob),
        address = COALESCE($4, address),
        city = COALESCE($5, city),
        state = COALESCE($6, state),
        country = COALESCE($7, country),
        college = COALESCE($8, college),
        degree = COALESCE($9, degree),
        department = COALESCE($10, department),
        graduation_year = COALESCE($11, graduation_year),
        cgpa = COALESCE($12, cgpa),
        career_objective = COALESCE($13, career_objective),
        about_me = COALESCE($14, about_me),
        linkedin_url = COALESCE($15, linkedin_url),
        github_url = COALESCE($16, github_url),
        portfolio_url = COALESCE($17, portfolio_url),
        skills = COALESCE($18, skills),
        projects = CASE 
          WHEN $19::text IS NOT NULL THEN $19::text 
          ELSE projects 
        END,
        resume_url = COALESCE($20, resume_url),
        updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $21
      RETURNING *
    `;

    const values = [
      input.full_name?.trim() || null,
      input.phone !== undefined ? input.phone?.trim() || null : null,
      input.dob !== undefined ? input.dob?.trim() || null : null,
      input.address !== undefined ? input.address?.trim() || null : null,
      input.city !== undefined ? input.city?.trim() || null : null,
      input.state !== undefined ? input.state?.trim() || null : null,
      input.country !== undefined ? input.country?.trim() || null : null,
      input.college !== undefined ? input.college?.trim() || null : null,
      input.degree !== undefined ? input.degree?.trim() || null : null,
      input.department !== undefined ? input.department?.trim() || null : null,
      input.graduation_year !== undefined ? (input.graduation_year ? Number(input.graduation_year) : null) : null,
      input.cgpa !== undefined ? input.cgpa?.trim() || null : null,
      input.career_objective !== undefined ? input.career_objective?.trim() || null : null,
      input.about_me !== undefined ? input.about_me?.trim() || null : null,
      input.linkedin_url !== undefined ? input.linkedin_url?.trim() || null : null,
      input.github_url !== undefined ? input.github_url?.trim() || null : null,
      input.portfolio_url !== undefined ? input.portfolio_url?.trim() || null : null,
      input.skills !== undefined ? input.skills?.trim() || null : null,
      formattedProjects,
      input.resume_url !== undefined ? input.resume_url?.trim() || null : null,
      userId,
    ];

    await query(updateSql, values);

    // Return the enriched profile with username, resume document, and calculated completion percentage
    return await this.getProfile(userId);
  }
}

