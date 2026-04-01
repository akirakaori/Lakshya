import { Navigate, Route, Routes } from "react-router-dom";
import { ToastContainer, Slide } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './styles/toast.css';

import { useState } from "react";
import RefreshHandler from "./refresh-handler";
import { AuthProvider } from "./context/auth-context";
import { ThemeProvider } from "./context/theme-context";
import ProtectedRoute from "./routes/protected-route";
import { useNotificationSocket } from './hooks/use-notification-socket';

// Auth Pages
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Home from "./pages/Home";
import SignupChoice from "./pages/signup-choice";
import Landing from "./pages/Landing";
import ForgotPassword from "./pages/forget-password";  
import ResetPassword from "./pages/reset-password";
import NotificationsPage from "./pages/notifications";
import PrivateRoute from "./components/private-route";



//about us , blog and contact us pages
import AboutPage from "./pages/about-page";
import BlogPage from "./pages/blog-page";
import ContactPage from "./pages/contact-page";
import { HowItWorksPage } from "./pages/how-it-works-page";


// Job Seeker Pages
import {
  JobSeekerDashboard,
  BrowseJobs,
  JobDetails,
  MyApplications,
  JobSeekerProfile,
  SavedJobs,
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

function NotificationSocketBridge() {
  useNotificationSocket();
  return null;
}

function App() {
  const [, setIsAuthenticated] = useState(false);

  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationSocketBridge />
        <div className="App min-h-screen bg-[var(--app-bg)] text-[var(--app-text)] transition-colors duration-300">
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
            
            {/* Public Job Details Route */}
            <Route path="/jobs/:jobId" element={<JobDetails />} />
            
            {/* Public Browse Jobs Route */}
            <Route path="/browse-jobs" element={<BrowseJobs />} />

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
              path="/job-seeker/saved-jobs"
              element={
                <ProtectedRoute allowedRoles={['job_seeker']}>
                  <SavedJobs />
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
            <Route
              path="/notifications"
              element={
                <ProtectedRoute allowedRoles={['job_seeker', 'recruiter']}>
                  <NotificationsPage />
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
                  <RecruiterProfile />
                </ProtectedRoute>
              }
            />
            <Route path="/about" element={<AboutPage />} />
<Route path="/contact" element={<ContactPage />} />
<Route path="/blog" element={<BlogPage />} />
<Route path="/how-it-works" element={<HowItWorksPage />} />

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
    </ThemeProvider>
  );
}

export default App;
