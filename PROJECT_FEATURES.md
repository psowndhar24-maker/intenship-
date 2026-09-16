# INTERNHUB — Functional Features Specification

> **Platform:** INTERNHUB — Internship Intelligence & Career Discovery Platform  
> **Target Audience:** College Students, Corporate Recruiters, Campus Placement Directors & Academic Evaluators  
> **Status:** Production-Ready & Fully Verified  

---

## 1. Student Portal Features

The Student Portal (`/dashboard/student`) provides an intuitive, high-performance workspace for university students to curate, apply for, and track internships throughout their academic career.

### 1.1 Authentication & Session Gateway
- **Role-Gated Access:** Protected under the `STUDENT` user role with cryptographic HMAC-SHA256 JWT tokens.
- **Auto-Redirect:** Automatically navigates to the Student Dashboard upon login.
- **Quick-Fill Credentials:** Pre-configured demo login (`student` / `admin@123`) available with a single click.

### 1.2 Comprehensive Student Academic Profile
- **Personal & Contact Info:** Full name, institutional email, phone number, date of birth, residential address, city, state, and country.
- **Academic Credentials:** College / University name, Degree (e.g., B.Tech, M.Tech, BCA), Department / Branch, Graduation Year, and cumulative CGPA.
- **Career Planning:** Career objective, "About Me" summary, and professional portfolio links (LinkedIn, GitHub, Personal Website).
- **Technical Skills Matrix:** Free-form, taggable technical skills list (e.g., TypeScript, React, Python, PostgreSQL).
- **Academic & Independent Projects:** Multi-item project list including Project Title, Description, Technologies Used, GitHub URL, and Live Demo URL.
- **Live Completion Meter:** Real-time percentage indicator tracking profile completeness across personal, academic, project, and resume categories.

### 1.3 Resume Upload & Document Engine
- **Supported Formats:** Strictly validates `.pdf`, `.doc`, and `.docx` file formats.
- **Size Limitation:** Enforces a 5MB maximum file size limit with clear validation feedback.
- **Upload Methods:** Supports both manual file picker selection and drag-and-drop file upload.
- **Inline Browser Preview:** Secure streaming endpoint (`/api/student/resume/view`) allowing students to inspect their active resume directly in browser.
- **Resume Download:** Dedicated attachment download endpoint (`/api/student/resume/download`).
- **Resume Replacement & Deletion:** Seamless replacement of older profile resumes while automatically cleaning up superseded physical files from storage.

### 1.4 Internship Discovery & Exploration
- **Curated Verified Listings:** Displays only administrative-approved opportunities (`APPROVED` status).
- **Real-Time Keyword Search:** Filter listings dynamically by title, company name, requirements, or location.
- **Multi-Facet Filtering:**
  - **Category:** Software Engineering, Embedded Systems, Web Development, Robotics, AI / Machine Learning, Data Science, Product Management.
  - **Work Mode:** Remote, Hybrid, On-site.
  - **Internship Type:** Full-time Internship, Summer Internship, Research Internship, Co-op Internship.
  - **Compensation Filter:** Toggle between Paid and Unpaid listings.
- **Rich Opportunity Modal:** Full specifications detailing stipend amount, currency, duration, eligibility requirements, day-to-day responsibilities, learning opportunities, benefits, and selection process stages.

### 1.5 Bookmarks & Saved Internships
- **One-Click Bookmark:** Save promising listings directly from the card or modal view.
- **Dedicated Saved Tab:** Dedicated tab to review, compare, or launch applications for saved opportunities.
- **Duplicate Prevention:** Database unique constraint (`UNIQUE(student_id, internship_id)`) preventing redundant bookmarks.

### 1.6 Job Application & Snapshot Submission
- **Eligibility Verification:** Informs students of requirements and ensures a profile resume is attached before submission.
- **Application Customization:** Input fields for tailored Cover Letters and optional supplementary remarks.
- **Immutable Resume Snapshot:** Automatically creates an isolated snapshot copy of the candidate's resume at submission time. Future changes or deletions to the student's profile resume do not modify the submitted application record.

### 1.7 Application Tracking & Lifecycle Pipeline
- **Visual Progress Tracker:** Color-coded multi-stage pipeline indicating progression through hiring phases:
  - `APPLIED` → `UNDER_REVIEW` → `SHORTLISTED` → `INTERVIEW` → `SELECTED` / `REJECTED`
- **Application Withdrawal:** Allows students to voluntarily withdraw an active application with status updated to `WITHDRAWN`.
- **Status Audit History:** View detailed status transition notes and timestamps added by recruiters.

### 1.8 Interactive Notification Center
- **Real-Time Alerts:** Top navigation notification bell with real-time unread badge count.
- **Contextual Updates:** Alerts generated on application status changes (e.g. "Application shortlisted", "Interview scheduled").
- **Mark as Read:** Interactive actions to mark individual notifications or all notifications as read.

---

## 2. Company (Corporate Recruiter) Portal Features

The Company Portal (`/dashboard/company`) enables employers to manage their organization profile, post internship listings, and manage candidate screening workflows.

### 2.1 Corporate Account Management
- **Role-Gated Access:** Protected under the `COMPANY` user role.
- **Verification Status:** Visual status indicator displaying organizational verification state (`PENDING`, `VERIFIED`, `REJECTED`, `SUSPENDED`).
- **Company Profile Editor:** Manage corporate details including official company name, website URL, contact email, location, and organizational description.

### 2.2 Internship Creation & Publishing
- **Structured Posting Form:** Clean form fields for:
  - Job Title, Category, and Internship Type
  - Work Mode (Remote, Hybrid, On-site) and Physical Location
  - Duration (e.g., "3 Months", "6 Months")
  - Stipend Amount and Currency (e.g., "₹45,000 / month")
  - Eligibility Criteria, Academic Prerequisites, and Target Experience Level
  - Detailed Responsibilities and Learning Opportunities
  - Benefits & Perks (e.g., PPO opportunity, equipment allowance, mentorship)
  - Multi-Round Selection Process Outline
  - Application Deadline Date
- **Default Moderation State:** Newly created listings are saved as `PENDING_APPROVAL`, awaiting placement administrator approval before appearing in student feeds.

### 2.3 Internship Management & Status Controls
- **Postings Overview:** Categorized views of active, pending, changes-requested, and closed listings.
- **Moderator Feedback Visibility:** If an administrator requests changes (`CHANGES_REQUESTED`) or rejects a post, the exact feedback reason is displayed directly to the recruiter.
- **Listing Updates:** Modify job specifications. When a rejected or changes-requested listing is edited, it resets to `PENDING_APPROVAL` for re-review.
- **Listing Deletion:** Remove listings that are no longer active.

### 2.4 Candidate Application Screening
- **Centralized Applicant Pipeline:** View all candidate submissions organized by job listing.
- **Candidate Dossier Modal:** Inspect comprehensive applicant information:
  - Full academic details, graduation year, degree, and CGPA
  - Candidate technical skills and documented projects
  - Cover letter and supplemental notes
- **Direct Resume Access:** Secure endpoint to inspect or download the candidate's frozen resume snapshot as submitted at application time.

### 2.5 Multi-Stage Application Progression
- **Pipeline Controls:** Advance candidates through formal recruitment stages:
  - `UNDER_REVIEW`: Application opened and under assessment
  - `SHORTLISTED`: Candidate passed initial resume screening
  - `INTERVIEW`: Candidate invited to technical/behavioral rounds
  - `SELECTED`: Candidate issued placement/internship offer
  - `REJECTED`: Candidate not moving forward
- **Review Notes:** Add custom internal or candidate-facing feedback notes for each status transition.
- **Automatic History Logging:** Every stage change automatically records an immutable entry in `application_status_history`.

---

## 3. Admin Command Center Features

The Administrative Command Center (`/dashboard/admin`) equips the campus placement directorate with total oversight, verification controls, and compliance logging.

### 3.1 Executive Placement Dashboard
- **Campus Metrics Overview:** Live summary counters displaying:
  - Total Internships, Pending Review, Approved, and Changes Requested
  - Total Companies, Pending Verification, and Verified Partners
  - Total Student Applications and Selection Counts
- **Quick Action Queues:** Direct shortcuts to pending internship reviews and unverified company requests.
- **Recent Audit Activity:** Live feed of recent administrative governance events.

### 3.2 Internship Moderation & Governance
- **Pending Review Queue (`/admin/internships/pending`):** Dedicated workflow view prioritizing listings requiring placement cell review.
- **Moderation Actions:**
  - **Approve:** Publishes the opportunity immediately to all eligible students with status `APPROVED`.
  - **Request Changes:** Requires an explanatory note (e.g., "Clarify working hours and stipend terms") and updates listing to `CHANGES_REQUESTED`.
  - **Reject:** Marks listing as `REJECTED` with required rationale.
- **Review History Timeline:** Complete historical audit trail of all moderation actions and comments taken on each listing.

### 3.3 Corporate Partner Verification
- **Employer Directory (`/admin/companies`):** Searchable list of all registered partner organizations.
- **Verification Governance:**
  - **Verify:** Confirms institutional validity (MoU, legal standing) and assigns `VERIFIED` status.
  - **Reject:** Denies company registration if legitimacy cannot be established.
  - **Suspend:** Revokes posting privileges for non-compliant employers.

### 3.4 Student Body & Placement Directory
- **Student Master Directory (`/admin/students`):** View registered students with degree, department, CGPA, graduation year, and profile completion metrics.
- **Direct Document Auditing:** Placement officers can view and verify student resumes directly from the administrative portal.

### 3.5 Global Application Governance
- **Campus Application Register (`/admin/applications`):** Complete view of all job applications campus-wide.
- **Cross-Checking Tools:** Filter applications by status, inspect candidate resumes, and ensure companies are adhering to placement timelines.

### 3.6 Compliance & Audit Logging (`/admin/audit-logs`)
- **Tamper-Resistant Ledger:** Automatic system-level tracking of all critical administrative actions.
- **Captured Metadata:** Includes actor ID, role, action type (`COMPANY_VERIFIED`, `INTERNSHIP_APPROVED`, `INTERNSHIP_CHANGES_REQUESTED`, etc.), target entity, timestamp, and JSON metadata.

### 3.7 System Configuration Diagnostics
- **Safe Diagnostics (`/api/admin/config-status`):** Real-time boolean health checks verifying database connectivity, active driver (`embedded_pglite` vs `remote_postgresql`), JWT configuration, and external API sync readiness—without leaking secrets.
