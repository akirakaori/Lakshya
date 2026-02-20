import { Navigate, Route, Routes } from "react-router-dom";
import { ToastContainer, Slide } from 'react-toastify';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import 'react-toastify/dist/ReactToastify.css';
import './styles/toast.css';

import { useState } from "react";
import RefreshHandler from "./refresh-handler";
import { AuthProvider } from "./context/auth-context";
import ProtectedRoute from "./routes/protected-route";

// Auth Pages
import Login from "./pages/login";
import Signup from "./pages/signup";
import Home from "./pages/home";
import SignupChoice from "./pages/signup-choice";
import Landing from "./pages/landing";
import ForgotPassword from "./pages/forget-password";  
import ResetPassword from "./pages/reset-password";
import PrivateRoute from "./components/private-route";

// Job Seeker Pages
import {
  JobSeekerDashboard,
  BrowseJobs,
  JobDetails,
  MyApplications,
  JobSeekerProfile,
} from "./pages/job-seeker";

// Recruiter Pages
import {
  RecruiterDashboard,
  PostJob,
  ManageJobs,
  JobApplications,
  CandidateProfile,
  RecruiterProfile,
} from "./pages/recruiter";

// Admin Pages
import { AdminProfile, AdminDashboard } from "./pages/admin";

// Create a client for TanStack Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  const [_, setIsAuthenticated] = useState(false);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <div className="App">
          <RefreshHandler setIsAuthenticated={setIsAuthenticated} />
          {/* Global Toast Container */}
          <ToastContainer
            position="top-center"
            autoClose={2500}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            rtl={false}
            pauseOnFocusLoss={false}
            draggable={false}
            pauseOnHover={false}
            theme="colored"
            transition={Slide}
            limit={1}
          />
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup-choice" element={<SignupChoice />} />
            <Route path="/signup/:role" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Protected Home Route */}
            <Route path="/home" element={<PrivateRoute element={<Home />} />} />

            {/* Admin Routes */}
            <Route path="/AdminDashboard" element={<PrivateRoute element={<AdminDashboard />} />} />
            <Route
              path="/admin/profile"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminProfile />
                </ProtectedRoute>
              }
            />

            {/* Job Seeker Routes */}
            <Route
              path="/job-seeker/dashboard"
              element={
                <ProtectedRoute allowedRoles={['job_seeker']}>
                  <JobSeekerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/job-seeker/browse-jobs"
              element={
                <ProtectedRoute allowedRoles={['job_seeker']}>
                  <BrowseJobs />
                </ProtectedRoute>
              }
            />
            <Route
              path="/job-seeker/jobs/:jobId"
              element={
                <ProtectedRoute allowedRoles={['job_seeker']}>
                  <JobDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="/job-seeker/my-applications"
              element={
                <ProtectedRoute allowedRoles={['job_seeker']}>
                  <MyApplications />
                </ProtectedRoute>
              }
            />
            <Route
              path="/job-seeker/profile"
              element={
                <ProtectedRoute allowedRoles={['job_seeker']}>
                  <JobSeekerProfile />
                </ProtectedRoute>
              }
            />
            {/* Legacy Job Seeker Dashboard Route */}
            <Route
              path="/JobSeekerDashboard"
              element={<Navigate to="/job-seeker/dashboard" replace />}
            />

            {/* Recruiter Routes */}
            <Route
              path="/recruiter/dashboard"
              element={
                <ProtectedRoute allowedRoles={['recruiter']}>
                  <RecruiterDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/recruiter/post-job"
              element={
                <ProtectedRoute allowedRoles={['recruiter']}>
                  <PostJob />
                </ProtectedRoute>
              }
            />
            <Route
              path="/recruiter/jobs/:jobId/edit"
              element={
                <ProtectedRoute allowedRoles={['recruiter']}>
                  <PostJob />
                </ProtectedRoute>
              }
            />
            <Route
              path="/recruiter/manage-jobs"
              element={
                <ProtectedRoute allowedRoles={['recruiter']}>
                  <ManageJobs />
                </ProtectedRoute>
              }
            />
            <Route
              path="/recruiter/jobs/:jobId/applications"
              element={
                <ProtectedRoute allowedRoles={['recruiter']}>
                  <JobApplications />
                </ProtectedRoute>
              }
            />
            <Route
              path="/recruiter/application/:applicationId"
              element={
                <ProtectedRoute allowedRoles={['recruiter']}>
                  <CandidateProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/recruiter/candidate/:candidateId"
              element={
                <ProtectedRoute allowedRoles={['recruiter']}>
                  <CandidateProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/recruiter/profile"
              element={
                <ProtectedRoute allowedRoles={['recruiter']}>
```                  <RecruiterProfile />
                </ProtectedRoute>
              }
            />
            {/* Legacy Recruiter Dashboard Route */}
            <Route
              path="/RecruiterDashboard"
              element={<Navigate to="/recruiter/dashboard" replace />}
            />

            {/* Catch all - redirect to landing */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
