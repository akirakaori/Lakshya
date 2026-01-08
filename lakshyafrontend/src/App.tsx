import { Navigate,Route, Routes } from "react-router-dom";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Home from "./pages/Home";
import { useState } from "react";
import RefreshHandler from "./RefreshHandler";
import SignupChoice from "./pages/SignupChoice";
import Landing from "./pages/Landing";
import ForgotPassword from "./pages/ForgetPassword";  
import ResetPassword from "./pages/ResetPassword";
import AdminDashboard from "./pages/AdminDashboard";
import RecruiterDashboard from "./pages/RecruiterDashboard";
import JobSeekerDashboard from "./pages/JobSeekerDashboard";
import PrivateRoute from "./components/PrivateRoute";


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
