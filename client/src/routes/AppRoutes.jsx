import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { PublicLayout } from '../components/layouts/PublicLayout.jsx';
import { PortalLayout } from '../components/layouts/PortalLayout.jsx';
import { ProtectedRoute, GuestRoute } from './ProtectedRoute.jsx';
import { ROLES } from '../constants/roles.js';

// Public & Auth Pages
import { HomePage } from '../pages/auth/HomePage.jsx';
import { CitizenLogin } from '../pages/auth/CitizenLogin.jsx';
import { StaffLogin } from '../pages/auth/StaffLogin.jsx';
import { CitizenSignup } from '../pages/auth/CitizenSignup.jsx';
import { ForgotPassword } from '../pages/auth/ForgotPassword.jsx';
import { ResetPassword } from '../pages/auth/ResetPassword.jsx';
import { AuthCallback } from '../pages/auth/AuthCallback.jsx';

// Citizen Pages
import { CitizenDashboard } from '../pages/citizen/CitizenDashboard.jsx';
import { RegisterComplaint } from '../pages/citizen/RegisterComplaint.jsx';
import { MyComplaints } from '../pages/citizen/MyComplaints.jsx';
import { ComplaintDetails } from '../pages/citizen/ComplaintDetails.jsx';
import { CitizenProfile } from '../pages/citizen/CitizenProfile.jsx';

// Operator Pages
import { OperatorDashboard } from '../pages/operator/OperatorDashboard.jsx';
import { IncomingQueue } from '../pages/operator/IncomingQueue.jsx';
import { OperatorComplaintDetail } from '../pages/operator/OperatorComplaintDetail.jsx';
import { OperatorHistory } from '../pages/operator/OperatorHistory.jsx';
import { OperatorProfile } from '../pages/operator/OperatorProfile.jsx';

// Engineer Pages
import { EngineerDashboard } from '../pages/engineer/EngineerDashboard.jsx';
import { VerificationQueue } from '../pages/engineer/VerificationQueue.jsx';
import { MyCases } from '../pages/engineer/MyCases.jsx';
import { EngineerComplaintDetail } from '../pages/engineer/EngineerComplaintDetail.jsx';
import { EngineerProfile } from '../pages/engineer/EngineerProfile.jsx';

// Admin Pages
import { AdminDashboard } from '../pages/admin/AdminDashboard.jsx';
import { StaffManagement } from '../pages/admin/StaffManagement.jsx';
import { DepartmentManagement } from '../pages/admin/DepartmentManagement.jsx';
import { ComplaintManagement } from '../pages/admin/ComplaintManagement.jsx';
import { AdminComplaintDetail } from '../pages/admin/AdminComplaintDetail.jsx';
import { CitizenManagement } from '../pages/admin/CitizenManagement.jsx';
import { AuditLogs } from '../pages/admin/AuditLogs.jsx';
import { AdminProfile } from '../pages/admin/AdminProfile.jsx';

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Pages wrapped in PublicLayout */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/auth/callback" element={<AuthCallback />} />

        {/* Guest only routes (redirect to dashboard if logged in) */}
        <Route element={<GuestRoute />}>
          <Route path="/login" element={<CitizenLogin />} />
          <Route path="/staff/login" element={<StaffLogin />} />
          <Route path="/signup" element={<CitizenSignup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
        </Route>
      </Route>

      {/* 1. CITIZEN PORTAL */}
      <Route element={<ProtectedRoute allowedRoles={[ROLES.CITIZEN]} />}>
        <Route element={<PortalLayout />}>
          <Route path="/citizen/dashboard" element={<CitizenDashboard />} />
          <Route path="/citizen/complaints/new" element={<RegisterComplaint />} />
          <Route path="/citizen/complaints" element={<MyComplaints />} />
          <Route path="/citizen/complaints/:id" element={<ComplaintDetails />} />
          <Route path="/citizen/profile" element={<CitizenProfile />} />
        </Route>
      </Route>

      {/* 2. OPERATOR PORTAL */}
      <Route element={<ProtectedRoute allowedRoles={[ROLES.OPERATOR]} />}>
        <Route element={<PortalLayout />}>
          <Route path="/operator/dashboard" element={<OperatorDashboard />} />
          <Route path="/operator/complaints" element={<IncomingQueue />} />
          <Route path="/operator/complaints/:id" element={<OperatorComplaintDetail />} />
          <Route path="/operator/history" element={<OperatorHistory />} />
          <Route path="/operator/profile" element={<OperatorProfile />} />
        </Route>
      </Route>

      {/* 3. ENGINEER PORTAL */}
      <Route element={<ProtectedRoute allowedRoles={[ROLES.ENGINEER]} />}>
        <Route element={<PortalLayout />}>
          <Route path="/engineer/dashboard" element={<EngineerDashboard />} />
          <Route path="/engineer/queue" element={<VerificationQueue />} />
          <Route path="/engineer/my-cases" element={<MyCases />} />
          <Route path="/engineer/complaints/:id" element={<EngineerComplaintDetail />} />
          <Route path="/engineer/profile" element={<EngineerProfile />} />
        </Route>
      </Route>

      {/* 4. ADMIN PORTAL */}
      <Route element={<ProtectedRoute allowedRoles={[ROLES.ADMIN]} />}>
        <Route element={<PortalLayout />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/staff" element={<StaffManagement />} />
          <Route path="/admin/departments" element={<DepartmentManagement />} />
          <Route path="/admin/complaints" element={<ComplaintManagement />} />
          <Route path="/admin/complaints/:id" element={<AdminComplaintDetail />} />
          <Route path="/admin/citizens" element={<CitizenManagement />} />
          <Route path="/admin/audit" element={<AuditLogs />} />
          <Route path="/admin/profile" element={<AdminProfile />} />
        </Route>
      </Route>

      {/* Catch-all Wildcard Route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
