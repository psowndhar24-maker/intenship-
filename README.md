# INTERNHUB
### Internship Intelligence & Career Discovery Platform

> A comprehensive, full-stack collegiate internship management and career discovery platform featuring multi-tier role-based access control (RBAC), end-to-end recruitment lifecycle governance, cryptographically secured resume snapshotting, and complete administrative oversight.

---

## 1. Project Overview

**INTERNHUB** is an enterprise-grade university internship discovery and placement governance platform. Designed specifically for modern collegiate placement ecosystems, it bridges the gap between students, corporate recruiters, and campus administrative authorities. 

The platform enforces transparent, auditable workflows for all placement interactions:
- **Companies** register, complete verification, publish internship opportunities, and evaluate applicant pools through structured candidate pipelines.
- **Students** build rich academic profiles, manage verified resumes, explore curated opportunities, apply with frozen application snapshots, and track hiring stages with real-time feedback.
- **University Administrators** hold centralized governance: moderating job postings with formal review trails, verifying employers, managing student records, tracking campus-wide hiring analytics, and inspecting immutable audit logs.

INTERNHUB is architected as an integrated single-process full-stack solution running Node.js, Express, React 19, TypeScript, and Tailwind CSS, backed by a dual-driver relational database architecture (supporting both embedded PGlite and remote PostgreSQL).

---

## 2. Problem Statement

Traditional university campus placement and internship workflows suffer from significant organizational challenges:
1. **Disjointed Channels & Lack of Governance:** Companies frequently post unvetted or informal job opportunities across informal chat groups, email chains, and bulletin boards, creating risk of unverified offers, unclear compensation terms, and inconsistent eligibility criteria.
2. **Missing Administrative Audit Trails:** Campus placement cells lack real-time visibility into employer activities, student participation rates, interview stages, and placement outcomes.
3. **Resume Desynchronization ("The Shifting Resume Problem"):** In naive portals, when a student updates their profile resume after applying to an internship, earlier recruiters unexpectedly see the modified resume. This invalidates earlier screening reviews and creates compliance issues.
4. **Complex Local Deployment:** Most enterprise portals require heavy database daemons, complex Docker orchestrations, or third-party cloud services just to run or demonstrate, creating hurdles for student evaluation, viva demonstrations, and lab testing.

---

## 3. Proposed Solution

INTERNHUB resolves these issues through a purpose-built, secure web platform:
- **Centralized Placement Portal:** A unified, secure gateway providing distinct interfaces and capabilities tailored strictly for Students, Corporate Recruiters, and University Placement Administrators.
- **Formal Multi-Stage Moderation:** All employer listings must pass a placement directorate moderation queue (`PENDING_APPROVAL` → `APPROVED` / `CHANGES_REQUESTED` / `REJECTED`) with required rationale logging before students can view or apply.
- **Application Resume Snapshot Engine:** When an application is submitted, the platform captures an isolated, physical document snapshot that remains immutable. Even if the student subsequently updates or deletes their profile resume, the recruiter and administrator retain the exact version submitted at application time.
- **Zero-Friction Dual-Engine Database:** Supports remote PostgreSQL via standard `DATABASE_URL` for production, and automatically falls back to an embedded zero-configuration PGlite (PostgreSQL WASM engine on disk) for instant local demonstration with zero external dependencies.

---

## 4. Objectives

- **Democratize Discovery:** Provide undergraduate and postgraduate candidates with equal, transparent access to verified internships with structured stipend and eligibility criteria.
- **Eliminate Fraud & Unvetted Postings:** Enforce strict administrative approval gates before any job listing is visible to students.
- **Streamline Recruiter Operations:** Provide companies with candidate evaluation pipelines (`APPLIED` → `UNDER_REVIEW` → `SHORTLISTED` → `INTERVIEW` → `SELECTED` / `REJECTED`).
- **Safeguard Document Integrity:** Implement secure document validation, path-traversal prevention, and unchangeable application snapshots.
- **Maintain Placement Transparency:** Log every critical moderation event in a tamper-resistant governance audit trail.

---

## 5. Key Features

- **Role-Based Access Control (RBAC):** Strict isolation between Student, Corporate, and Administrator roles with cryptographic JWT session validation.
- **Live Search & Multi-Criteria Filtering:** Filter internships by category (Software, AI, Web, Embedded, Robotics), work mode (Remote, Hybrid, On-site), stipend structure (Paid/Unpaid), and text keywords.
- **Student Profile Management:** Tracks comprehensive academic data including CGPA, graduation year, degree, department, skills, and portfolio links.
- **Resume Management & Snapshot Engine:** Validates PDF, DOC, and DOCX files up to 5MB, providing secure inline viewing, download endpoints, and isolated application-time snapshots.
- **Recruitment Pipeline Tracker:** Visual multi-stage status progress bar with status history notes for students and recruiters.
- **Bookmark & Saved Internships:** One-click bookmarking allowing students to curate target opportunities.
- **Interactive Notification Center:** Unread count indicators and real-time alerts for application status updates, moderation results, and feedback.
- **Administrative Command Center:** Real-time metrics, pending queues, employer verification controls, and audit log exploration.
- **Built-In External Sync Engine:** Extensible sync architecture capable of ingesting external internship feeds with configurable scheduling.

---

## 6. User Roles

| Role | Primary Purpose | Capabilities |
| :--- | :--- | :--- |
| **STUDENT** | Internship discovery, application, and career tracking | • Browse and filter approved internships<br>• Bookmark / save postings<br>• Upload, view, and replace profile resume<br>• Submit applications with cover letters and snapshot resumes<br>• Track application progress through hiring stages<br>• Withdraw pending applications<br>• Receive status notifications |
| **COMPANY** | Talent acquisition and candidate evaluation | • Create new internship listings<br>• Edit draft or existing listings<br>• Monitor listing approval status and admin feedback<br>• Review applicant profiles and submitted resume snapshots<br>• Advance candidate statuses (`UNDER_REVIEW`, `SHORTLISTED`, `INTERVIEW`, `SELECTED`, `REJECTED`)<br>• Maintain corporate profile details |
| **ADMIN** | Platform governance and placement supervision | • Review pending internship postings with Approve, Reject, or Request Changes actions<br>• Verify, suspend, or reject corporate employer accounts<br>• Monitor campus-wide application metrics and student profiles<br>• Access all candidate application documents<br>• Inspect system audit logs with actor and timestamp records<br>• Inspect safe runtime configuration diagnostics |

---

## 7. Technology Stack

INTERNHUB uses a proven, production-grade modern JavaScript/TypeScript stack:

```text
┌────────────────────────────────────────────────────────┐
│                        FRONTEND                        │
│   React 19  •  TypeScript  •  Tailwind CSS 4  •  Vite  │
│       React Router 7  •  Lucide Icons  •  Motion       │
└───────────────────────────▲────────────────────────────┘
                            │ REST APIs / JSON / Multipart
┌───────────────────────────▼────────────────────────────┐
│                        BACKEND                         │
│     Node.js  •  Express 4  •  TypeScript  •  Multer    │
│    HMAC-SHA256 JWT  •  Crypto  •  Safe Path Security   │
└───────────────────────────▲────────────────────────────┘
                            │ Parameterized SQL Queries
┌───────────────────────────▼────────────────────────────┐
│                        DATABASE                        │
│     PostgreSQL (Remote)  OR  PGlite (Embedded WASM)    │
│    Relational Schemas  •  Foreign Keys  •  Audit Logs  │
└────────────────────────────────────────────────────────┘
```

### Frontend
- **React 19 (`react`, `react-dom`):** Latest concurrent React runtime with component-driven state architecture.
- **Vite 6 (`vite`, `@vitejs/plugin-react`):** Ultra-fast compilation, bundling, and hot-reload development server.
- **React Router 7 (`react-router-dom`):** Declarative client-side routing with nested layouts and role-based guards.
- **Tailwind CSS 4 (`tailwindcss`, `@tailwindcss/vite`):** Modern utility-first CSS engine configured via the native Vite plugin.
- **Motion (`motion`):** Hardware-accelerated transitions and interaction animations.
- **Lucide React (`lucide-react`):** Clean, accessible icon system for dashboard navigation and status visualizers.

### Backend
- **Node.js & Express 4 (`express`):** High-throughput asynchronous REST API server.
- **TypeScript 5.8 (`typescript`, `tsx`):** End-to-end type safety across controllers, services, middleware, and schemas.
- **Multer 2 (`multer`, `@types/multer`):** Multipart form handler configured with disk storage, extension filters, and size limiters.
- **Native Node Crypto (`crypto`):** Zero-dependency HMAC-SHA256 JWT generation, signature verification, and secure random ID hashing.
- **Esbuild (`esbuild`):** Fast server compilation bundling TypeScript backend into standalone CommonJS (`dist/server.cjs`).

### Database & Storage
- **ElectricSQL PGlite (`@electric-sql/pglite`):** Embedded, single-file serverless PostgreSQL engine running directly inside Node.js. Requires zero external database installation.
- **PostgreSQL Client Pool (`pg`, `@types/pg`):** Production connection pooling client for remote PostgreSQL clusters.
- **Local Secure Disk Storage:** Sandboxed filesystem directories (`data/uploads/resumes` and `data/uploads/applications`) with path-traversal guards.

---

## 8. System Architecture

```text
                                  ┌───────────────────────────────┐
                                  │         Web Browser           │
                                  │ (Student / Company / Admin)   │
                                  └──────────────┬────────────────┘
                                                 │ HTTP / Port 3000
                                                 ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                       INTERNHUB SERVER                                          │
│                                                                                                 │
│  ┌──────────────────────────┐                      ┌─────────────────────────────────────────┐  │
│  │   Vite Frontend SPA /    │                      │          Express REST API               │  │
│  │   Static Dist Server     │                      │          (/api/* routes)                │  │
│  └──────────────────────────┘                      └────────────────────┬────────────────────┘  │
│                                                                         │                       │
│                                            ┌────────────────────────────┼────────────────────┐  │
│                                            ▼                            ▼                    ▼  │
│                                  ┌───────────────────┐        ┌───────────────────┐┌─────────┐  │
│                                  │  Auth Middleware  │        │   Controllers &   ││ Multer  │  │
│                                  │ (JWT + RBAC Guard)│        │  Business Logic   ││ Storage │  │
│                                  └───────────────────┘        └─────────┬─────────┘└────┬────┘  │
└─────────────────────────────────────────────────────────────────────────┼───────────────┼───────┘
                                                                          │ SQL           │ File I/O
                                                 ┌────────────────────────┴───────┐       ▼
                                                 ▼                                ▼  ┌─────────────┐
                                  ┌─────────────────────────────┐ ┌───────────────┐  │data/uploads/│
                                  │ Embedded PGlite (Default)   │ │ External PG   │  │resumes &    │
                                  │ data/internhub_pglite/      │ │ DATABASE_URL  │  │applications │
                                  └─────────────────────────────┘ └───────────────┘  └─────────────┘
```

### Architectural Highlights:
1. **Single-Port Simplicity:** Both the frontend client application and backend REST API are served on a single unified port (`3000`), eliminating CORS configuration issues and proxy desynchronization.
2. **Layered Decoupling:** Routers handle URL routing and authorization; Controllers handle input parsing and HTTP contracts; Services execute business logic and data transactions; the DB layer handles parameterized SQL execution.
3. **Dual-Mode Persistence:** The backend automatically inspects `DATABASE_URL`. If present, it connects via `pg.Pool`; otherwise, it seamlessly initializes the embedded `PGlite` driver in `data/internhub_pglite/`.

---

## 9. Frontend Architecture

The frontend is organized cleanly within `/frontend/src`:

```text
frontend/src/
├── components/               # Specialized UI widgets & modals
│   ├── admin/                # Admin-specific reason modals & timelines
│   │   ├── ReasonActionModal.tsx
│   │   └── ReviewHistoryTimeline.tsx
│   ├── ApplicationDetailModal.tsx
│   ├── InternshipCard.tsx    # Responsive opportunity card with tags
│   ├── InternshipModal.tsx   # Detailed job view & application submission
│   ├── MetricCard.tsx        # Dashboard stat widgets
│   ├── NotificationBell.tsx  # Unread badge & interactive dropdown
│   ├── ProtectedRoute.tsx    # Role-based route authorization gatekeeper
│   ├── ResumeUploadCard.tsx  # File drag-and-drop & replace manager
│   ├── StatusBadge.tsx       # Color-coded status chip indicator
│   ├── StudentProfileForm.tsx# Comprehensive student CV editor
│   └── TechHeader.tsx        # Dashboard navigation header & role banner
├── hooks/
│   └── useAuth.tsx           # Global AuthContext, token sync & user state
├── layouts/
│   └── DashboardLayout.tsx   # Layout chassis with header, sidebar, and breadcrumbs
├── pages/                    # Role-specific dashboard views
│   ├── LandingPage.tsx       # Public hero overview & role selector
│   ├── LoginPage.tsx         # Unified login gateway with quick-fill credentials
│   ├── StudentDashboard.tsx  # Student tabs: Explore, Applications, Saved, Profile
│   ├── CompanyDashboard.tsx  # Company tabs: Postings, Applications, Profile
│   ├── AdminDashboard.tsx    # Placement overview metrics & pending queues
│   ├── AdminInternshipsQueue.tsx
│   ├── AdminPendingQueue.tsx
│   ├── AdminInternshipReview.tsx
│   ├── AdminCompanies.tsx
│   ├── AdminCompanyDetail.tsx
│   ├── AdminStudents.tsx
│   ├── AdminApplications.tsx
│   └── AdminAuditLogs.tsx
├── services/                 # Modular API client wrappers
│   ├── api.ts                # Centralized fetch client with bearer token injection
│   ├── auth.service.ts
│   ├── internshipService.ts
│   ├── studentService.ts
│   ├── companyService.ts
│   ├── adminService.ts
│   └── notificationService.ts
├── types/                    # Shared TypeScript interfaces for models & API
└── styles/
    └── globals.css           # Tailwind CSS directives and custom typography
```

---

## 10. Backend Architecture

The backend is built modularly within `/backend/src`:

```text
backend/src/
├── config/
│   └── env.ts                # Centralized, validated environment configuration
├── controllers/              # HTTP request and response handlers
│   ├── admin.controller.ts
│   ├── application.controller.ts
│   ├── auth.controller.ts
│   ├── company.controller.ts
│   ├── health.controller.ts
│   ├── internship.controller.ts
│   ├── notification.controller.ts
│   └── student.controller.ts
├── db/
│   └── index.ts              # SQL schema initialization, seed data & queries
├── middleware/
│   ├── auth.middleware.ts    # JWT verification & role authorization (RBAC)
│   └── error.middleware.ts   # Centralized error handler
├── routes/                   # Endpoint definitions
│   ├── admin.routes.ts
│   ├── application.routes.ts
│   ├── auth.routes.ts
│   ├── company.routes.ts
│   ├── externalInternship.routes.ts
│   ├── health.routes.ts
│   ├── index.ts              # Master API router mounted at /api
│   ├── internship.routes.ts
│   ├── notification.routes.ts
│   └── student.routes.ts
├── services/                 # Core domain services & database operations
│   ├── admin.service.ts
│   ├── application.service.ts
│   ├── auth.service.ts
│   ├── company.service.ts
│   ├── document.service.ts   # Multer file storage & snapshot management
│   ├── external/             # Sync scheduler & external provider types
│   ├── internship.service.ts
│   ├── notification.service.ts
│   ├── saved.service.ts
│   └── student.service.ts
├── types/
│   └── index.ts              # Domain types, role enums, and request schemas
├── utils/
│   ├── jwt.ts                # HMAC-SHA256 token signer & verifier
│   └── logger.ts             # Sanitized production logger
└── server.ts                 # Express factory with middleware & route mounts
```

---

## 11. Database Architecture

The system utilizes 14 specialized relational tables created automatically on boot:

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                             DATABASE SCHEMAS                                │
└─────────────────────────────────────────────────────────────────────────────┘

  users ───┬──── (1:1) ────> companies ────────── (1:N) ────> internships
           │                                                      │
           ├──── (1:1) ────> student_profiles                     │
           │                      │                               │
           │                    (1:N)                           (1:N)
           │                      │                               │
           │                      ▼                               ▼
           │             student_documents                   applications ◄───┐
           │                      ▲                               │           │
           │                      │ Snapshot Copy                 │ (1:N)     │ (1:N)
           │                      └───────────────────────────────┼───────┐   │
           │                                                      ▼       ▼   │
           │                                     application_documents    │   │
           │                                                              │   │
           │                                     application_status_history   │
           │                                                                  │
           ├──────────────────────────── (1:N) ────> saved_internships ───────┘
           ├──────────────────────────── (1:N) ────> notifications
           ├──────────────────────────── (1:N) ────> audit_logs
           └──────────────────────────── (1:N) ────> admin_reviews
```

### Table Descriptions:

1. **`users`**: Core identity table. Stores user ID, username, password credential, assigned role (`STUDENT`, `COMPANY`, `ADMIN`), and timestamps.
2. **`companies`**: Employer entity table linked to `users.id`. Stores company name, corporate email, website, headquarters location, overview description, and `verification_status` (`PENDING`, `VERIFIED`, `REJECTED`, `SUSPENDED`).
3. **`student_profiles`**: Student profile linked to `users.id`. Stores full name, contact information, college, degree, department, graduation year, CGPA, technical skills, projects JSON, and resume link.
4. **`internships`**: Central listing table linked to `companies.id`. Contains title, category, work mode (`Remote`, `Hybrid`, `On-site`), duration, stipend, currency, eligibility, responsibilities, deadline, and `status` (`DRAFT`, `PENDING_APPROVAL`, `CHANGES_REQUESTED`, `APPROVED`, `REJECTED`, `CLOSED`, `EXPIRED`).
5. **`applications`**: Application records joining `student_profiles.id` and `internships.id`. Tracks current pipeline `status` (`APPLIED`, `UNDER_REVIEW`, `SHORTLISTED`, `INTERVIEW`, `SELECTED`, `ACCEPTED`, `REJECTED`, `WITHDRAWN`), cover letter, additional notes, and linked `resume_id`.
6. **`student_documents`**: Active documents uploaded to student profile (`RESUME`). Stores original filename, sanitized disk filename, MIME type, file size in bytes, and physical storage path.
7. **`application_documents`**: Immutable resume snapshot created at the exact moment of application submission. Captures the physical document copy linked specifically to `applications.id`.
8. **`application_status_history`**: Audit trail for recruitment pipeline changes. Records `old_status`, `new_status`, modifying user ID, user role, review notes, and timestamp.
9. **`saved_internships`**: Bookmarks table linking student profiles to saved internship listings with a unique constraint preventing duplicate bookmarks.
10. **`admin_reviews`**: Formal moderation records for internship listings. Stores moderation action (`APPROVED`, `REJECTED`, `CHANGES_REQUESTED`), admin ID, feedback reason, and timestamp.
11. **`audit_logs`**: System-wide governance log capturing administrative actions (e.g. `COMPANY_VERIFIED`, `INTERNSHIP_APPROVED`, `INTERNSHIP_REJECTED`) with structured JSON metadata.
12. **`notifications`**: User notification feed. Stores title, message, entity relations, and read receipt boolean.
13. **`company_notifications`**: Dedicated notifications for recruiters regarding applicant submissions and moderation outcomes.
14. **`external_sync_logs`**: Logs synchronization runs from external provider feeds, recording fetched, imported, updated, and failed counts.

---

## 12. Core Workflows

### A. Authentication & Session Flow
```text
User enters Credentials + Role
               │
               ▼
   POST /api/auth/login
               │
      [Credentials Valid?] ──No──> 401 Unauthorized
               │ Yes
               ▼
Generate HMAC-SHA256 JWT Token (Payload: sub, username, role, exp: 24h)
               │
               ▼
Client stores token in localStorage ('internhub_token')
               │
               ▼
Subsequent requests attach Header: "Authorization: Bearer <token>"
               │
               ▼
auth.middleware validates signature, expiry, and matches required role
```

### B. Internship Creation & Moderation Flow
```text
Company creates Listing ──> status: PENDING_APPROVAL
                                    │
                                    ▼
                     Visible in Admin Pending Queue
                                    │
               ┌────────────────────┼────────────────────┐
               ▼                    ▼                    ▼
       Admin Approves       Admin Rejects       Admin Requests Changes
               │                    │                    │
        status: APPROVED     status: REJECTED    status: CHANGES_REQUESTED
               │                    │                    │
    Visible to Students     Archived in Queue    Company updates listing
            for Discovery                        and resubmits for review
```

### C. Student Application & Resume Snapshot Flow
```text
Student selects an APPROVED internship
                  │
                  ▼
Checks for active resume in student_documents
                  │
   [Resume exists?] ──No──> Prompt to upload Resume (PDF/DOC/DOCX, <=5MB)
         │ Yes
         ▼
Student enters Cover Letter & clicks "Submit Application"
                  │
                  ▼
Backend creates record in applications (status: APPLIED)
                  │
                  ▼
DocumentService copies profile resume to:
data/uploads/applications/app_<appId>_<hash>.pdf
                  │
                  ▼
Creates immutable record in application_documents
                  │
                  ▼
Creates initial entry in application_status_history
                  │
                  ▼
Notifies Company Recruiter of new candidate
```

### D. Resume Replacement & Snapshot Isolation Guarantee
```text
Scenario: Student updates resume AFTER submitting Application #1

1. Student uploads "Resume_v2.pdf" via Student Profile.
2. Backend replaces student_documents record with new file.
3. Old profile file in data/uploads/resumes is replaced.
4. Application #1 snapshot in data/uploads/applications remains 100% UNTOUCHED.
5. Recruiter reviewing Application #1 continues to inspect the original Resume_v1.
```

---

## 13. API Reference

All application endpoints are served under `/api` on port `3000`.

### Authentication Endpoints
| Method | Endpoint | Description | Authorization |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Authenticate user credentials & receive JWT | Public |
| `GET` | `/api/auth/me` | Fetch active session profile from token | Authenticated (Any) |

### Public & Student Internship Endpoints
| Method | Endpoint | Description | Authorization |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/internships` | Paginated listing of approved internships with search and filters | Public |
| `GET` | `/api/internships/:id` | Fetch detailed single internship specifications | Public |
| `GET` | `/api/internships/saved` | List all internships bookmarked by the student | `STUDENT` |
| `POST` | `/api/internships/:id/apply` | Submit formal application with resume snapshot | `STUDENT` |
| `POST` | `/api/internships/:id/save` | Bookmark an internship | `STUDENT` |
| `DELETE` | `/api/internships/:id/save` | Remove bookmark from an internship | `STUDENT` |

### Student Profile & Document Endpoints
| Method | Endpoint | Description | Authorization |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/student/profile` | Retrieve student profile and CV completion status | `STUDENT` |
| `PUT` | `/api/student/profile` | Update academic, contact, and project info | `STUDENT` |
| `GET` | `/api/student/stats` | Retrieve student dashboard placement statistics | `STUDENT` |
| `GET` | `/api/student/resume` | Get metadata for active profile resume | `STUDENT` |
| `POST` | `/api/student/resume` | Upload or replace profile resume (multipart/form-data) | `STUDENT` |
| `PUT` | `/api/student/resume` | Replace profile resume (multipart/form-data) | `STUDENT` |
| `GET` | `/api/student/resume/view` | Stream resume file inline for browser preview | `STUDENT` |
| `GET` | `/api/student/resume/download` | Download resume file as attachment | `STUDENT` |
| `DELETE` | `/api/student/resume` | Delete active profile resume file and database record | `STUDENT` |

### Application Governance Endpoints
| Method | Endpoint | Description | Authorization |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/applications/student` | Fetch applications submitted by logged-in student | `STUDENT` |
| `POST` | `/api/applications/:id/withdraw` | Withdraw a pending or active application | `STUDENT` |
| `GET` | `/api/applications/:id` | Retrieve application details with status history | `STUDENT`, `COMPANY`, `ADMIN` |
| `GET` | `/api/applications/:id/resume` | View/stream the frozen application resume snapshot | `STUDENT`, `COMPANY`, `ADMIN` |

### Company Portal Endpoints
| Method | Endpoint | Description | Authorization |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/company/profile` | Fetch employer organization profile & verification status | `COMPANY` |
| `PUT` | `/api/company/profile` | Update employer profile details | `COMPANY` |
| `GET` | `/api/company/stats` | Retrieve applicant counts and active listing metrics | `COMPANY` |
| `GET` | `/api/company/internships` | List all internships posted by this company | `COMPANY` |
| `POST` | `/api/company/internships` | Create new internship listing (sets `PENDING_APPROVAL`) | `COMPANY` |
| `GET` | `/api/company/internships/:id` | Get single internship details with review notes | `COMPANY` |
| `PUT` | `/api/company/internships/:id` | Update internship listing (resets to `PENDING_APPROVAL` if rejected) | `COMPANY` |
| `DELETE` | `/api/company/internships/:id` | Remove internship listing | `COMPANY` |
| `GET` | `/api/company/applications` | List candidate applications across all company listings | `COMPANY` |
| `PATCH` | `/api/company/applications/:id/status` | Advance candidate stage (`SHORTLISTED`, `INTERVIEW`, etc.) | `COMPANY` |

### Admin Moderation Endpoints
| Method | Endpoint | Description | Authorization |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/admin/dashboard` | Placement metrics, pending review counts, and recent logs | `ADMIN` |
| `GET` | `/api/admin/internships/pending` | Filtered queue of listings awaiting placement approval | `ADMIN` |
| `GET` | `/api/admin/internships` | Master list of all internships with status filters | `ADMIN` |
| `GET` | `/api/admin/internships/:id` | Comprehensive listing view for audit | `ADMIN` |
| `GET` | `/api/admin/internships/:id/reviews` | Review history timeline for an internship | `ADMIN` |
| `POST` | `/api/admin/internships/:id/approve` | Approve listing and publish to student discovery | `ADMIN` |
| `POST` | `/api/admin/internships/:id/reject` | Reject listing with required reason | `ADMIN` |
| `POST` | `/api/admin/internships/:id/request-changes` | Request modifications from company with feedback notes | `ADMIN` |
| `GET` | `/api/admin/companies` | List all registered companies and verification statuses | `ADMIN` |
| `GET` | `/api/admin/companies/:id` | View corporate details and posted opportunities | `ADMIN` |
| `POST` | `/api/admin/companies/:id/verify` | Mark employer account as VERIFIED | `ADMIN` |
| `POST` | `/api/admin/companies/:id/reject` | Mark employer account as REJECTED | `ADMIN` |
| `POST` | `/api/admin/companies/:id/suspend` | Suspend employer posting privileges | `ADMIN` |
| `GET` | `/api/admin/students` | Master directory of student candidate profiles | `ADMIN` |
| `GET` | `/api/admin/applications` | Master list of all campus applications | `ADMIN` |
| `GET` | `/api/admin/audit-logs` | Tamper-resistant log of administrative decisions | `ADMIN` |
| `GET` | `/api/admin/config-status` | Safe boolean indicators of system runtime configuration | `ADMIN` |
| `POST` | `/api/admin/external-internships/sync` | Trigger manual synchronization of external opportunities | `ADMIN` |

### System & Health Endpoints
| Method | Endpoint | Description | Authorization |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Service uptime, database health, and readiness probe | Public |
| `GET` | `/api/notifications` | Fetch user notification notifications | Authenticated (Any) |
| `GET` | `/api/notifications/unread-count` | Fetch unread notification badge count | Authenticated (Any) |
| `PUT` | `/api/notifications/read-all` | Mark all user notifications as read | Authenticated (Any) |
| `PUT` | `/api/notifications/:id/read` | Mark single notification as read | Authenticated (Any) |
| `GET` | `/api/external-internships/status` | External feed configuration status | Public |

---

## 14. Environment Variables

All configuration is centralized in `backend/src/config/env.ts` with strict defaults:

| Variable Name | Required | Default Value | Description |
| :--- | :---: | :--- | :--- |
| `PORT` | No | `3000` | HTTP port on which Express server binds. |
| `DATABASE_URL` | No | *Empty* (Uses PGlite) | PostgreSQL connection string (`postgresql://user:pass@host:5432/db`). When unset, defaults to zero-config local PGlite. |
| `JWT_SECRET` | Required in Prod | `internhub_dev_secret_key_matrix_2026` | Cryptographic secret for signing HMAC-SHA256 user authentication tokens. |
| `INTERN_API_KEY` | No | *Empty* | Optional API credential for external internship ingest services. |
| `EXTERNAL_SYNC_ENABLED` | No | `false` | Enable automatic background cron sync of external job opportunities. |
| `EXTERNAL_SYNC_INTERVAL_MINUTES` | No | `360` (6 hours) | Frequency of automatic background synchronization in minutes. |
| `NODE_ENV` | No | `development` | Environment mode (`development` or `production`). |

---

## 15. Local Setup & Execution Guide

Follow these steps to run INTERNHUB locally:

### 1. Prerequisites
- **Node.js**: Version 18.x or higher installed (`node -v`).
- **npm**: Version 9.x or higher installed (`npm -v`).

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment
A default `.env` is already pre-configured for local execution. To configure custom settings:
```bash
cp .env.example .env
```
*(No configuration edits are required; the embedded PGlite database runs automatically!)*

### 4. Start Development Server
```bash
npm run dev
```
The server starts immediately on `http://localhost:3000`. Both the frontend and backend run seamlessly together.

### 5. Production Build & Start
To verify and run the production build:
```bash
npm run build
npm start
```

---

## 16. Demo Credentials

The platform is pre-seeded with three demo accounts ready for evaluation:

| Portal | Role Indicator | Username | Password | Default Redirect | Sample Pre-seeded Data |
| :--- | :---: | :---: | :---: | :--- | :--- |
| **Student Portal** | `STUDENT` | `student` | `admin@123` | `/dashboard/student` | Alex Mercer (B.Tech CS, 2026) |
| **Company Portal** | `COMPANY` | `company` | `admin@123` | `/dashboard/company` | Nexus Dynamics Labs (Verified Employer) |
| **Admin Portal** | `ADMIN` | `admin` | `admin@123` | `/dashboard/admin` | Campus Placement Directorate |

*Note: The unified Login page (`/login`) includes one-click quick-fill buttons for all three accounts for fast demonstrations.*

---

## 17. Security Architecture

1. **Cryptographic JWT Tokens:** Custom HMAC-SHA256 token implementation with 24-hour expiration, ensuring no unsigned tokens are accepted.
2. **Strict Role Isolation (RBAC):** Backend route middleware enforces `authorizeRole(['ADMIN'])` or `authorizeRole(['COMPANY'])`. Attempts to access unauthorized routes return `403 Forbidden`.
3. **Application Snapshot Isolation:** Candidate resumes are duplicated into an isolated `applications` folder at submission time, safeguarding historical compliance.
4. **Path Traversal Defense:** The document service strictly executes `assertPathWithinDir` on all file operations, preventing malicious `../` path traversal attacks.
5. **MIME & Extension Whitelisting:** File uploads are restricted to `.pdf`, `.doc`, and `.docx` under a strict 5MB limit.
6. **Parameterized SQL Queries:** All SQL queries throughout the repository use parameterized variables (`$1`, `$2`), eliminating SQL injection vulnerabilities.
7. **Zero Secret Leakage:** No database credentials or API secrets are exposed via API responses or frontend client bundles.

---

## 18. Project Structure

```text
INTERNHUB/
├── .env.example              # Central environment variables specification
├── .gitignore                # Git exclusions (node_modules, uploads, etc.)
├── README.md                 # Master college project documentation
├── PROJECT_FEATURES.md       # Comprehensive role-by-role feature specification
├── PROJECT_TEST_REPORT.md    # Verified test verification matrix
├── metadata.json             # Applet metadata & platform permissions
├── package.json              # Root build dependencies & unified scripts
├── server.ts                 # Full-stack entry point with Vite middleware
├── tsconfig.json             # Root TypeScript compilation rules
├── vite.config.ts            # Vite 6 + Tailwind CSS plugin config
│
├── backend/
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── config/           # Centralized typed environment loading
│       ├── controllers/      # REST API request handlers
│       ├── db/               # PostgreSQL & PGlite schemas & seed scripts
│       ├── middleware/       # JWT authentication & error handlers
│       ├── routes/           # Express endpoint routers
│       ├── services/         # Domain business logic & document engine
│       ├── types/            # TypeScript interfaces & enums
│       └── utils/            # JWT crypto signer & sanitized logger
│
├── frontend/
│   ├── index.html            # Entry HTML document
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── src/
│       ├── components/       # Cards, badges, modals, profile forms
│       ├── hooks/            # useAuth authentication hook
│       ├── layouts/          # Responsive dashboard chassis
│       ├── pages/            # Student, Company, and Admin dashboards
│       ├── services/         # Fetch API client abstractions
│       ├── styles/           # Tailwind CSS 4 setup & typography
│       ├── types/            # Frontend contract types
│       └── utils/            # Client storage & formatting helpers
│
└── data/
    ├── internhub_pglite/     # Embedded PostgreSQL database files
    └── uploads/
        ├── resumes/          # Active student profile resumes
        └── applications/     # Frozen application resume snapshots
```

---

## 19. Future Scope

1. **Campus Interview Scheduler:** Direct integration with Google Calendar / Outlook for organizing corporate interview time slots.
2. **Automated Eligibility Matchmaking:** Intelligent matching algorithm evaluating student CGPA, department prerequisites, and graduation year against corporate criteria.
3. **Official Placement Offer Acceptance Flow:** Digital signing workflow for issuance and student acceptance of formal pre-placement offers (PPOs).
4. **Alumni Mentorship Network:** Enabling verified alumni to post specialized fellowship and mentorship opportunities for junior students.
5. **Comprehensive Accreditation Export:** Direct CSV and PDF report generation matching NAAC, NBA, and NIRF university ranking audit standards.

---

## 20. Conclusion

INTERNHUB delivers an academic-ready, enterprise-grade placement platform that eliminates the chaos of informal internship workflows. Through rigorous role-based access control, formal moderation gates, and cryptographically secure document snapshots, the platform protects institutional integrity while empowering students with transparent career discovery.
