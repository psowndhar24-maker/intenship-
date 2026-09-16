import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { StudentDashboard } from './pages/StudentDashboard';
import { CompanyDashboard } from './pages/CompanyDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminInternshipsQueue } from './pages/AdminInternshipsQueue';
import { AdminPendingQueue } from './pages/AdminPendingQueue';
import { AdminInternshipReview } from './pages/AdminInternshipReview';
import { AdminCompanies } from './pages/AdminCompanies';
import { AdminCompanyDetail } from './pages/AdminCompanyDetail';
import { AdminStudents } from './pages/AdminStudents';
import { AdminApplications } from './pages/AdminApplications';
import { AdminAuditLogs } from './pages/AdminAuditLogs';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Root Route */}
          <Route path="/" element={<LandingPage />} />

          {/* Authentication Gateway */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Student Routes */}
          <Route
            path="/dashboard/student"
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <StudentDashboard initialTab="EXPLORE" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/student/applications"
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <StudentDashboard initialTab="APPLICATIONS" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/student/saved"
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <StudentDashboard initialTab="SAVED" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/student/profile"
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <StudentDashboard initialTab="PROFILE" />
              </ProtectedRoute>
            }
          />

          {/* Protected Corporate Routes */}
          <Route
            path="/dashboard/company"
            element={
              <ProtectedRoute allowedRoles={['COMPANY']}>
                <CompanyDashboard initialTab="POSTINGS" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/company/internships"
            element={
              <ProtectedRoute allowedRoles={['COMPANY']}>
                <CompanyDashboard initialTab="POSTINGS" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/company/applications"
            element={
              <ProtectedRoute allowedRoles={['COMPANY']}>
                <CompanyDashboard initialTab="APPLICATIONS" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/company/profile"
            element={
              <ProtectedRoute allowedRoles={['COMPANY']}>
                <CompanyDashboard initialTab="PROFILE" />
              </ProtectedRoute>
            }
          />

          {/* Admin Command Center & Moderation Routes */}
          <Route
            path="/dashboard/admin"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/internships"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminInternshipsQueue />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/internships/pending"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminPendingQueue />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/internships/:id"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminInternshipReview />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/companies"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminCompanies />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/companies/:id"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminCompanyDetail />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/students"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminStudents />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/applications"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminApplications />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/audit-logs"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminAuditLogs />
              </ProtectedRoute>
            }
          />

          {/* Catch-all Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
