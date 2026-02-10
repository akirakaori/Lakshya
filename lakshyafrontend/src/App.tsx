import { Navigate,Route, Routes } from "react-router-dom";

import Login from "./pages/login";
import Signup from "./pages/signup";
import Home from "./pages/home";
import { useState } from "react";
import RefreshHandler from "./refresh-handler";
import SignupChoice from "./pages/signup-choice";
import Landing from "./pages/landing";
import ForgotPassword from "./pages/forget-password";  
import ResetPassword from "./pages/reset-password";
import AdminDashboard from "./pages/admin-dashboard";
import RecruiterDashboard from "./pages/recruiter-dashboard";
import JobSeekerDashboard from "./pages/job-seeker-dashboard";
import PrivateRoute from "./components/private-route";


function App() {
  const [isAuthenticated ,setIsAuthenticated] = useState(false);


  return (
    <div className ="App">
      <RefreshHandler setIsAuthenticated={setIsAuthenticated} />
      {/* <h1>Lakshya Frontend Running 🚀</h1> */}
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup-choice" element={<SignupChoice />} />
        <Route path="/signup/:role" element={<Signup />} />
        <Route path="/home" element={<PrivateRoute element={<Home />} />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/AdminDashboard" element={<PrivateRoute element={<AdminDashboard />} />} />
        <Route path="/RecruiterDashboard" element={<PrivateRoute element={<RecruiterDashboard />} />} />
        <Route path="/JobSeekerDashboard" element={<PrivateRoute element={<JobSeekerDashboard />} />} />
      </Routes>
    </div>        
  );
}

export default App;
