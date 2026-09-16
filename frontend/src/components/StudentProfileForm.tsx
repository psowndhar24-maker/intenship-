import React, { useState, useEffect } from 'react';
import { StudentProfile, StudentDocument, ProjectItem, ProfileCompletionDetails } from '../types/internship';
import { StudentService } from '../services/studentService';
import { ResumeUploadCard } from './ResumeUploadCard';
import { 
  User, 
  GraduationCap, 
  Briefcase, 
  FileCode, 
  FolderGit2, 
  Plus, 
  Trash2, 
  Edit3, 
  Save, 
  Globe, 
  Linkedin, 
  Github, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Info
} from 'lucide-react';

interface StudentProfileFormProps {
  initialProfile: StudentProfile;
  onProfileUpdated: (profile: StudentProfile) => void;
}

export const StudentProfileForm: React.FC<StudentProfileFormProps> = ({
  initialProfile,
  onProfileUpdated,
}) => {
  // Main form state
  const [formData, setFormData] = useState<Partial<StudentProfile>>({
    full_name: initialProfile.full_name || '',
    email: initialProfile.email || '',
    phone: initialProfile.phone || '',
    dob: initialProfile.dob || '',
    address: initialProfile.address || '',
    city: initialProfile.city || '',
    state: initialProfile.state || '',
    country: initialProfile.country || 'India',
    college: initialProfile.college || '',
    degree: initialProfile.degree || '',
    department: initialProfile.department || '',
    graduation_year: initialProfile.graduation_year || new Date().getFullYear() + 1,
    cgpa: initialProfile.cgpa || '',
    career_objective: initialProfile.career_objective || '',
    about_me: initialProfile.about_me || '',
    linkedin_url: initialProfile.linkedin_url || '',
    github_url: initialProfile.github_url || '',
    portfolio_url: initialProfile.portfolio_url || '',
    skills: initialProfile.skills || '',
    projects: Array.isArray(initialProfile.projects)
      ? initialProfile.projects
      : typeof initialProfile.projects === 'string'
      ? (() => {
          try {
            return JSON.parse(initialProfile.projects);
          } catch {
            return [];
          }
        })()
      : [],
  });

  const [resumeDoc, setResumeDoc] = useState<StudentDocument | null>(
    initialProfile.resume_document || null
  );

  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Skills input tag state
  const [skillInput, setSkillInput] = useState('');

  // Project modal / editor state
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editingProjectIndex, setEditingProjectIndex] = useState<number | null>(null);
  const [projectForm, setProjectForm] = useState<ProjectItem>({
    title: '',
    description: '',
    technologies: '',
    role: '',
    duration: '',
    github_url: '',
    demo_url: '',
  });

  useEffect(() => {
    if (initialProfile) {
      setFormData({
        full_name: initialProfile.full_name || '',
        email: initialProfile.email || '',
        phone: initialProfile.phone || '',
        dob: initialProfile.dob || '',
        address: initialProfile.address || '',
        city: initialProfile.city || '',
        state: initialProfile.state || '',
        country: initialProfile.country || 'India',
        college: initialProfile.college || '',
        degree: initialProfile.degree || '',
        department: initialProfile.department || '',
        graduation_year: initialProfile.graduation_year || new Date().getFullYear() + 1,
        cgpa: initialProfile.cgpa || '',
        career_objective: initialProfile.career_objective || '',
        about_me: initialProfile.about_me || '',
        linkedin_url: initialProfile.linkedin_url || '',
        github_url: initialProfile.github_url || '',
        portfolio_url: initialProfile.portfolio_url || '',
        skills: initialProfile.skills || '',
        projects: Array.isArray(initialProfile.projects)
          ? initialProfile.projects
          : typeof initialProfile.projects === 'string'
          ? (() => {
              try {
                return JSON.parse(initialProfile.projects);
              } catch {
                return [];
              }
            })()
          : [],
      });
      setResumeDoc(initialProfile.resume_document || null);
    }
  }, [initialProfile]);

  const showNotification = (text: string, type: 'success' | 'error' = 'success') => {
    setNotification({ text, type });
    setTimeout(() => setNotification(null), 4500);
  };

  // Profile completion calculation (mirrors backend weighting)
  const calculateLocalCompletion = (): ProfileCompletionDetails => {
    const hasPersonal = Boolean(formData.full_name && formData.full_name.trim().length > 1);
    const hasContact = Boolean(formData.email && formData.phone && formData.phone.trim().length > 4);
    const hasAcademic = Boolean(
      formData.college &&
      formData.degree &&
      formData.graduation_year
    );
    const hasSkills = Boolean(formData.skills && formData.skills.trim().length > 0);
    const hasProjects = Array.isArray(formData.projects) && formData.projects.length > 0;
    const hasProfessional = Boolean(
      (formData.career_objective && formData.career_objective.trim().length > 0) ||
      (formData.about_me && formData.about_me.trim().length > 0) ||
      formData.linkedin_url ||
      formData.github_url
    );
    const hasResume = Boolean(resumeDoc);

    const weights = [
      { key: 'personal', passed: hasPersonal, weight: 15 },
      { key: 'contact', passed: hasContact, weight: 15 },
      { key: 'academic', passed: hasAcademic, weight: 20 },
      { key: 'skills', passed: hasSkills, weight: 15 },
      { key: 'projects', passed: hasProjects, weight: 15 },
      { key: 'professional', passed: hasProfessional, weight: 10 },
      { key: 'resume', passed: hasResume, weight: 10 },
    ];

    const percentage = weights.reduce((acc, w) => acc + (w.passed ? w.weight : 0), 0);
    const completedCount = weights.filter((w) => w.passed).length;

    return {
      percentage,
      breakdown: {
        personal: hasPersonal,
        contact: hasContact,
        academic: hasAcademic,
        skills: hasSkills,
        projects: hasProjects,
        professional: hasProfessional,
        resume: hasResume,
      },
      totalFieldsCount: weights.length,
      completedFieldsCount: completedCount,
    };
  };

  const completion = calculateLocalCompletion();

  // Skills handlers
  const currentSkillsList = (formData.skills || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const handleAddSkill = (skill: string) => {
    const trimmed = skill.trim();
    if (!trimmed) return;
    if (currentSkillsList.map((s) => s.toLowerCase()).includes(trimmed.toLowerCase())) {
      setSkillInput('');
      return;
    }
    const updated = [...currentSkillsList, trimmed].join(', ');
    setFormData({ ...formData, skills: updated });
    setSkillInput('');
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    const updated = currentSkillsList
      .filter((s) => s.toLowerCase() !== skillToRemove.toLowerCase())
      .join(', ');
    setFormData({ ...formData, skills: updated });
  };

  // Projects handlers
  const handleOpenAddProject = () => {
    setEditingProjectIndex(null);
    setProjectForm({
      title: '',
      description: '',
      technologies: '',
      role: '',
      duration: '',
      github_url: '',
      demo_url: '',
    });
    setIsProjectModalOpen(true);
  };

  const handleOpenEditProject = (index: number) => {
    const projects = (formData.projects as ProjectItem[]) || [];
    const item = projects[index];
    if (item) {
      setEditingProjectIndex(index);
      setProjectForm({ ...item });
      setIsProjectModalOpen(true);
    }
  };

  const handleSaveProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectForm.title.trim()) return;

    const currentProjects = [...((formData.projects as ProjectItem[]) || [])];
    if (editingProjectIndex !== null && editingProjectIndex >= 0) {
      currentProjects[editingProjectIndex] = { ...projectForm };
    } else {
      currentProjects.push({
        ...projectForm,
        id: `proj_${Date.now()}`,
      });
    }

    setFormData({ ...formData, projects: currentProjects });
    setIsProjectModalOpen(false);
  };

  const handleDeleteProject = (index: number) => {
    const currentProjects = [...((formData.projects as ProjectItem[]) || [])];
    currentProjects.splice(index, 1);
    setFormData({ ...formData, projects: currentProjects });
  };

  // Save profile submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload: Partial<StudentProfile> = {
        ...formData,
        projects: formData.projects || [],
      };

      const response = await StudentService.updateProfile(payload);
      if (response.success && response.data) {
        showNotification('Student Profile updated successfully.', 'success');
        onProfileUpdated(response.data);
      } else {
        showNotification(response.message || 'Failed to update profile.', 'error');
      }
    } catch (err: any) {
      showNotification(err.message || 'Error occurred while saving profile.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 font-sans">
      {/* Alert Banner */}
      {notification && (
        <div
          className={`p-3.5 rounded border text-xs font-mono flex items-center justify-between gap-3 ${
            notification.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-700/80 text-emerald-200'
              : 'bg-rose-950/80 border-rose-700/80 text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{notification.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-white cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* 1. PROFILE COMPLETION METER */}
      <div id="profile-completion-meter" className="p-5 rounded bg-[#080d19] border border-cyan-900/60 space-y-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs uppercase tracking-wider text-cyan-400 font-bold">
                PROFILE COMPLETION STATUS
              </span>
              <span className={`px-2 py-0.5 rounded font-mono text-xs font-bold ${
                completion.percentage >= 80
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  : completion.percentage >= 50
                  ? 'bg-amber-950 text-amber-300 border border-amber-800'
                  : 'bg-rose-950 text-rose-300 border border-rose-800'
              }`}>
                {completion.percentage}% COMPLETE
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              A comprehensive profile maximizes shortlisting by institutional and corporate recruiters.
            </p>
          </div>

          <div className="text-right">
            <span className="font-mono text-xs text-slate-400">
              Sections: <strong className="text-slate-100">{completion.completedFieldsCount} / {completion.totalFieldsCount}</strong>
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              completion.percentage >= 80
                ? 'bg-gradient-to-r from-cyan-500 to-emerald-400'
                : completion.percentage >= 50
                ? 'bg-gradient-to-r from-amber-500 to-cyan-400'
                : 'bg-gradient-to-r from-rose-500 to-amber-500'
            }`}
            style={{ width: `${completion.percentage}%` }}
          />
        </div>

        {/* Breakdown Chips */}
        <div className="flex items-center gap-2 flex-wrap pt-1 font-mono text-[11px]">
          <span className={`flex items-center gap-1 px-2.5 py-1 rounded border ${
            completion.breakdown.personal
              ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
              : 'bg-slate-900 border-slate-800 text-slate-500'
          }`}>
            <CheckCircle2 className="w-3 h-3" /> Personal
          </span>

          <span className={`flex items-center gap-1 px-2.5 py-1 rounded border ${
            completion.breakdown.contact
              ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
              : 'bg-slate-900 border-slate-800 text-slate-500'
          }`}>
            <CheckCircle2 className="w-3 h-3" /> Contact
          </span>

          <span className={`flex items-center gap-1 px-2.5 py-1 rounded border ${
            completion.breakdown.academic
              ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
              : 'bg-slate-900 border-slate-800 text-slate-500'
          }`}>
            <CheckCircle2 className="w-3 h-3" /> Academic
          </span>

          <span className={`flex items-center gap-1 px-2.5 py-1 rounded border ${
            completion.breakdown.skills
              ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
              : 'bg-slate-900 border-slate-800 text-slate-500'
          }`}>
            <CheckCircle2 className="w-3 h-3" /> Skills
          </span>

          <span className={`flex items-center gap-1 px-2.5 py-1 rounded border ${
            completion.breakdown.projects
              ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
              : 'bg-slate-900 border-slate-800 text-slate-500'
          }`}>
            <CheckCircle2 className="w-3 h-3" /> Projects
          </span>

          <span className={`flex items-center gap-1 px-2.5 py-1 rounded border ${
            completion.breakdown.professional
              ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
              : 'bg-slate-900 border-slate-800 text-slate-500'
          }`}>
            <CheckCircle2 className="w-3 h-3" /> Professional
          </span>

          <span className={`flex items-center gap-1 px-2.5 py-1 rounded border ${
            completion.breakdown.resume
              ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
              : 'bg-slate-900 border-slate-800 text-slate-500'
          }`}>
            <CheckCircle2 className="w-3 h-3" /> Resume / CV
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* 2. SECTION: RESUME / CV DOCUMENT MANAGEMENT */}
        <div className="p-6 rounded bg-[#0b101b] border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2 text-cyan-400">
              <FileCode className="w-4 h-4" />
              <h3 className="font-mono text-sm font-bold text-slate-100 uppercase tracking-wider">
                Official Resume / Curriculum Vitae
              </h3>
            </div>
            <span className="font-mono text-[11px] text-slate-400">REQUIRED FOR APPLICATIONS</span>
          </div>

          <p className="text-xs text-slate-400">
            Upload your verified resume in PDF, DOC, or DOCX format. When applying to internships, a verified snapshot of this resume will be archived with your application.
          </p>

          <ResumeUploadCard
            resume={resumeDoc}
            onUploadSuccess={(doc) => {
              setResumeDoc(doc);
              showNotification('Resume document updated successfully.', 'success');
            }}
            onDeleteSuccess={() => {
              setResumeDoc(null);
              showNotification('Resume document removed.', 'success');
            }}
          />
        </div>

        {/* 3. SECTION: PERSONAL INFORMATION */}
        <div className="p-6 rounded bg-[#0b101b] border border-slate-800 space-y-5">
          <div className="flex items-center gap-2 text-cyan-400 pb-3 border-b border-slate-800">
            <User className="w-4 h-4" />
            <h3 className="font-mono text-sm font-bold text-slate-100 uppercase tracking-wider">
              1. Personal Information &amp; Address
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-slate-400 block mb-1 font-mono text-[11px] uppercase">
                Full Name *
              </label>
              <input
                id="student-full-name"
                type="text"
                required
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="w-full px-3 py-2 rounded bg-[#060911] border border-slate-700 text-slate-100 focus:border-cyan-500 focus:outline-none text-xs"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1 font-mono text-[11px] uppercase">
                Email Address *
              </label>
              <input
                id="student-email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 rounded bg-[#060911] border border-slate-700 text-slate-100 focus:border-cyan-500 focus:outline-none text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-slate-400 block mb-1 font-mono text-[11px] uppercase">
                Telephone / Mobile *
              </label>
              <input
                id="student-phone"
                type="tel"
                placeholder="+91 98765 43210"
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 rounded bg-[#060911] border border-slate-700 text-slate-100 focus:border-cyan-500 focus:outline-none text-xs font-mono"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1 font-mono text-[11px] uppercase">
                Date of Birth
              </label>
              <input
                id="student-dob"
                type="date"
                value={formData.dob || ''}
                onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                className="w-full px-3 py-2 rounded bg-[#060911] border border-slate-700 text-slate-100 focus:border-cyan-500 focus:outline-none text-xs font-mono"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-400 block mb-1 font-mono text-[11px] uppercase">
              Street Address
            </label>
            <input
              id="student-address"
              type="text"
              placeholder="House/Apartment #, Sector, Street"
              value={formData.address || ''}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2 rounded bg-[#060911] border border-slate-700 text-slate-100 focus:border-cyan-500 focus:outline-none text-xs"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-slate-400 block mb-1 font-mono text-[11px] uppercase">
                City
              </label>
              <input
                id="student-city"
                type="text"
                placeholder="Bengaluru"
                value={formData.city || ''}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-3 py-2 rounded bg-[#060911] border border-slate-700 text-slate-100 focus:border-cyan-500 focus:outline-none text-xs"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1 font-mono text-[11px] uppercase">
                State / Province
              </label>
              <input
                id="student-state"
                type="text"
                placeholder="Karnataka"
                value={formData.state || ''}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full px-3 py-2 rounded bg-[#060911] border border-slate-700 text-slate-100 focus:border-cyan-500 focus:outline-none text-xs"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1 font-mono text-[11px] uppercase">
                Country
              </label>
              <input
                id="student-country"
                type="text"
                placeholder="India"
                value={formData.country || 'India'}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                className="w-full px-3 py-2 rounded bg-[#060911] border border-slate-700 text-slate-100 focus:border-cyan-500 focus:outline-none text-xs"
              />
            </div>
          </div>
        </div>

        {/* 4. SECTION: ACADEMIC CREDENTIALS */}
        <div className="p-6 rounded bg-[#0b101b] border border-slate-800 space-y-5">
          <div className="flex items-center gap-2 text-cyan-400 pb-3 border-b border-slate-800">
            <GraduationCap className="w-4 h-4" />
            <h3 className="font-mono text-sm font-bold text-slate-100 uppercase tracking-wider">
              2. Academic Information
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-slate-400 block mb-1 font-mono text-[11px] uppercase">
                College / University Name *
              </label>
              <input
                id="student-college"
                type="text"
                placeholder="National Institute of Technology"
                value={formData.college || ''}
                onChange={(e) => setFormData({ ...formData, college: e.target.value })}
                className="w-full px-3 py-2 rounded bg-[#060911] border border-slate-700 text-slate-100 focus:border-cyan-500 focus:outline-none text-xs"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1 font-mono text-[11px] uppercase">
                Degree / Program of Study *
              </label>
              <input
                id="student-degree"
                type="text"
                placeholder="B.Tech, B.E., MCA, M.Tech"
                value={formData.degree || ''}
                onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
                className="w-full px-3 py-2 rounded bg-[#060911] border border-slate-700 text-slate-100 focus:border-cyan-500 focus:outline-none text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-slate-400 block mb-1 font-mono text-[11px] uppercase">
                Department / Branch
              </label>
              <input
                id="student-department"
                type="text"
                placeholder="Computer Science & Engg"
                value={formData.department || ''}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-3 py-2 rounded bg-[#060911] border border-slate-700 text-slate-100 focus:border-cyan-500 focus:outline-none text-xs"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1 font-mono text-[11px] uppercase">
                Graduation Year *
              </label>
              <input
                id="student-graduation-year"
                type="number"
                min={2020}
                max={2032}
                value={formData.graduation_year || ''}
                onChange={(e) => setFormData({ ...formData, graduation_year: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded bg-[#060911] border border-slate-700 text-slate-100 focus:border-cyan-500 focus:outline-none text-xs font-mono"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1 font-mono text-[11px] uppercase">
                CGPA / Percentage
              </label>
              <input
                id="student-cgpa"
                type="text"
                placeholder="8.85 / 10.0 or 85%"
                value={formData.cgpa || ''}
                onChange={(e) => setFormData({ ...formData, cgpa: e.target.value })}
                className="w-full px-3 py-2 rounded bg-[#060911] border border-slate-700 text-slate-100 focus:border-cyan-500 focus:outline-none text-xs font-mono"
              />
            </div>
          </div>
        </div>

        {/* 5. SECTION: TECHNICAL SKILLS */}
        <div className="p-6 rounded bg-[#0b101b] border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2 text-cyan-400">
              <FileCode className="w-4 h-4" />
              <h3 className="font-mono text-sm font-bold text-slate-100 uppercase tracking-wider">
                3. Technical Skills &amp; Proficiencies
              </h3>
            </div>
            <span className="font-mono text-xs text-slate-400">{currentSkillsList.length} skills added</span>
          </div>

          {/* Tag Chips */}
          <div className="flex items-center gap-1.5 flex-wrap min-h-[40px] p-2.5 rounded bg-[#060911] border border-slate-800">
            {currentSkillsList.length === 0 ? (
              <span className="text-xs text-slate-500 italic">No skills added yet. Type below and press Enter or comma.</span>
            ) : (
              currentSkillsList.map((skill) => (
                <span
                  key={skill}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-cyan-950/80 border border-cyan-700/60 text-cyan-300 font-mono text-xs"
                >
                  <span>{skill}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(skill)}
                    className="text-cyan-400 hover:text-white cursor-pointer"
                  >
                    ×
                  </button>
                </span>
              ))
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Add a skill (e.g., TypeScript, Python, PostgreSQL, Docker)..."
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ',') {
                  e.preventDefault();
                  handleAddSkill(skillInput);
                }
              }}
              className="flex-1 px-3 py-2 rounded bg-[#060911] border border-slate-700 text-slate-100 focus:border-cyan-500 focus:outline-none text-xs"
            />
            <button
              type="button"
              onClick={() => handleAddSkill(skillInput)}
              className="px-4 py-2 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-mono text-xs cursor-pointer"
            >
              Add Skill
            </button>
          </div>
        </div>

        {/* 6. SECTION: PROFESSIONAL & ONLINE PRESENCE */}
        <div className="p-6 rounded bg-[#0b101b] border border-slate-800 space-y-5">
          <div className="flex items-center gap-2 text-cyan-400 pb-3 border-b border-slate-800">
            <Briefcase className="w-4 h-4" />
            <h3 className="font-mono text-sm font-bold text-slate-100 uppercase tracking-wider">
              4. Professional &amp; Online Presence
            </h3>
          </div>

          <div>
            <label className="text-slate-400 block mb-1 font-mono text-[11px] uppercase">
              Career Objective
            </label>
            <textarea
              rows={2}
              placeholder="Aspiring backend engineer looking to apply distributed systems, database design, and cloud infrastructure to real-world products."
              value={formData.career_objective || ''}
              onChange={(e) => setFormData({ ...formData, career_objective: e.target.value })}
              className="w-full px-3 py-2 rounded bg-[#060911] border border-slate-700 text-slate-100 focus:border-cyan-500 focus:outline-none text-xs leading-relaxed"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1 font-mono text-[11px] uppercase">
              About Me / Candidate Bio
            </label>
            <textarea
              rows={3}
              placeholder="Describe your technical background, extracurricular honors, hackathon achievements, and core interests..."
              value={formData.about_me || ''}
              onChange={(e) => setFormData({ ...formData, about_me: e.target.value })}
              className="w-full px-3 py-2 rounded bg-[#060911] border border-slate-700 text-slate-100 focus:border-cyan-500 focus:outline-none text-xs leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-slate-400 block mb-1 font-mono text-[11px] uppercase flex items-center gap-1">
                <Linkedin className="w-3.5 h-3.5 text-cyan-400" />
                <span>LinkedIn URL</span>
              </label>
              <input
                type="url"
                placeholder="https://linkedin.com/in/username"
                value={formData.linkedin_url || ''}
                onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                className="w-full px-3 py-2 rounded bg-[#060911] border border-slate-700 text-slate-100 focus:border-cyan-500 focus:outline-none text-xs font-mono"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1 font-mono text-[11px] uppercase flex items-center gap-1">
                <Github className="w-3.5 h-3.5 text-cyan-400" />
                <span>GitHub URL</span>
              </label>
              <input
                type="url"
                placeholder="https://github.com/username"
                value={formData.github_url || ''}
                onChange={(e) => setFormData({ ...formData, github_url: e.target.value })}
                className="w-full px-3 py-2 rounded bg-[#060911] border border-slate-700 text-slate-100 focus:border-cyan-500 focus:outline-none text-xs font-mono"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1 font-mono text-[11px] uppercase flex items-center gap-1">
                <Globe className="w-3.5 h-3.5 text-cyan-400" />
                <span>Portfolio Website</span>
              </label>
              <input
                type="url"
                placeholder="https://yourportfolio.dev"
                value={formData.portfolio_url || ''}
                onChange={(e) => setFormData({ ...formData, portfolio_url: e.target.value })}
                className="w-full px-3 py-2 rounded bg-[#060911] border border-slate-700 text-slate-100 focus:border-cyan-500 focus:outline-none text-xs font-mono"
              />
            </div>
          </div>
        </div>

        {/* 7. SECTION: PROJECTS */}
        <div className="p-6 rounded bg-[#0b101b] border border-slate-800 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2 text-cyan-400">
              <FolderGit2 className="w-4 h-4" />
              <h3 className="font-mono text-sm font-bold text-slate-100 uppercase tracking-wider">
                5. Technical Projects Portfolio
              </h3>
            </div>
            <button
              id="btn-add-project"
              type="button"
              onClick={handleOpenAddProject}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-cyan-950 hover:bg-cyan-900 border border-cyan-700/60 text-cyan-300 font-mono text-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Project</span>
            </button>
          </div>

          {((formData.projects as ProjectItem[]) || []).length === 0 ? (
            <div className="p-8 text-center bg-[#070b14] border border-slate-800 rounded space-y-2">
              <FolderGit2 className="w-6 h-6 text-slate-600 mx-auto" />
              <p className="font-mono text-xs text-slate-300 font-bold">No Projects Listed</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Highlighting academic coursework, open-source repositories, or personal development projects significantly elevates recruiter evaluation.
              </p>
              <button
                type="button"
                onClick={handleOpenAddProject}
                className="px-3 py-1.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-mono text-xs cursor-pointer mt-2"
              >
                + Add Your First Project
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {((formData.projects as ProjectItem[]) || []).map((proj, idx) => (
                <div
                  key={proj.id || idx}
                  className="p-4 rounded bg-[#070b14] border border-slate-800 flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-mono text-sm font-bold text-slate-100">
                        {proj.title}
                      </h4>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleOpenEditProject(idx)}
                          className="p-1 rounded text-slate-400 hover:text-cyan-300 hover:bg-slate-900 cursor-pointer"
                          title="Edit Project"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteProject(idx)}
                          className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-900 cursor-pointer"
                          title="Delete Project"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {proj.role && (
                      <p className="font-mono text-[11px] text-cyan-400">
                        Role: {proj.role} {proj.duration ? `• ${proj.duration}` : ''}
                      </p>
                    )}

                    <p className="text-xs text-slate-400 line-clamp-3">
                      {proj.description}
                    </p>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-800/80">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {proj.technologies
                        .split(',')
                        .map((t) => t.trim())
                        .filter(Boolean)
                        .map((tech) => (
                          <span
                            key={tech}
                            className="px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800 text-[10px] font-mono"
                          >
                            {tech}
                          </span>
                        ))}
                    </div>

                    <div className="flex items-center gap-3 font-mono text-[11px] pt-1">
                      {proj.github_url && (
                        <a
                          href={proj.github_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-slate-400 hover:text-cyan-300"
                        >
                          <Github className="w-3 h-3" />
                          <span>Code</span>
                        </a>
                      )}
                      {proj.demo_url && (
                        <a
                          href={proj.demo_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-slate-400 hover:text-cyan-300"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Demo</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SUBMIT BUTTON BAR */}
        <div className="pt-4 flex items-center justify-between border-t border-slate-800 flex-wrap gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
            <Info className="w-4 h-4 text-cyan-400" />
            <span>Updates are immediately synchronized across your applicant profile</span>
          </div>

          <button
            id="btn-save-student-profile"
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2.5 rounded bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 border border-cyan-400 text-slate-950 font-bold font-mono text-xs cursor-pointer transition-colors shadow-sm disabled:cursor-not-allowed"
          >
            <Save className={`w-4 h-4 ${isSaving ? 'animate-spin' : ''}`} />
            <span>{isSaving ? 'SAVING PROFILE CHANGES...' : 'SAVE STUDENT PROFILE'}</span>
          </button>
        </div>
      </form>

      {/* PROJECT ADD / EDIT MODAL */}
      {isProjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-[#090d16] border border-cyan-800/80 w-full max-w-lg rounded p-6 space-y-4 font-sans">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="font-mono text-sm font-bold text-slate-100 uppercase">
                {editingProjectIndex !== null ? 'EDIT PROJECT' : 'ADD NEW PROJECT'}
              </h3>
              <button
                type="button"
                onClick={() => setIsProjectModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProject} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-400 block mb-1 font-mono text-[11px] uppercase">
                  Project Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Distributed Task Queue"
                  value={projectForm.title}
                  onChange={(e) => setProjectForm({ ...projectForm, title: e.target.value })}
                  className="w-full px-3 py-2 rounded bg-[#060911] border border-slate-700 text-slate-100 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1 font-mono text-[11px] uppercase">
                    Your Role
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Lead Developer, Backend"
                    value={projectForm.role || ''}
                    onChange={(e) => setProjectForm({ ...projectForm, role: e.target.value })}
                    className="w-full px-3 py-2 rounded bg-[#060911] border border-slate-700 text-slate-100 focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1 font-mono text-[11px] uppercase">
                    Duration
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 3 Months (2025)"
                    value={projectForm.duration || ''}
                    onChange={(e) => setProjectForm({ ...projectForm, duration: e.target.value })}
                    className="w-full px-3 py-2 rounded bg-[#060911] border border-slate-700 text-slate-100 focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-mono text-[11px] uppercase">
                  Technologies Used * (Comma-separated)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Node.js, Redis, Docker, PostgreSQL"
                  value={projectForm.technologies}
                  onChange={(e) => setProjectForm({ ...projectForm, technologies: e.target.value })}
                  className="w-full px-3 py-2 rounded bg-[#060911] border border-slate-700 text-slate-100 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-mono text-[11px] uppercase">
                  Project Description *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Explain the problem solved, architectural choices, throughput, and impact..."
                  value={projectForm.description}
                  onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                  className="w-full px-3 py-2 rounded bg-[#060911] border border-slate-700 text-slate-100 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1 font-mono text-[11px] uppercase">
                    GitHub Link
                  </label>
                  <input
                    type="url"
                    placeholder="https://github.com/..."
                    value={projectForm.github_url || ''}
                    onChange={(e) => setProjectForm({ ...projectForm, github_url: e.target.value })}
                    className="w-full px-3 py-2 rounded bg-[#060911] border border-slate-700 text-slate-100 focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1 font-mono text-[11px] uppercase">
                    Live Demo Link
                  </label>
                  <input
                    type="url"
                    placeholder="https://demo.app"
                    value={projectForm.demo_url || ''}
                    onChange={(e) => setProjectForm({ ...projectForm, demo_url: e.target.value })}
                    className="w-full px-3 py-2 rounded bg-[#060911] border border-slate-700 text-slate-100 focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800 font-mono">
                <button
                  type="button"
                  onClick={() => setIsProjectModalOpen(false)}
                  className="px-3.5 py-1.5 rounded bg-slate-900 border border-slate-700 text-slate-300 hover:text-white cursor-pointer"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold cursor-pointer"
                >
                  {editingProjectIndex !== null ? 'UPDATE PROJECT' : 'ADD PROJECT'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
