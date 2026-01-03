import { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';
import { handleSuccess } from "../Utils";
import {ToastContainer} from 'react-toastify';
import JobSeekerDashboard from "./JobSeekerDashboard";
import RecruiterDashboard from "./RecruiterDashboard";
import AdminDashboard from "./AdminDashboard";

function Home() {

      const [loggedInUser, setLoggedInUser] = useState('');
      const [role, setRole] = useState<string | null>(null);
      const navigate = useNavigate();

      useEffect(() => {
        setLoggedInUser(localStorage.getItem("loggedInUser") || '');
        setRole(localStorage.getItem("role"));
      }, [])
      const handleLogout = (e:any) => {
        localStorage.removeItem("token");
        localStorage.removeItem("loggedInUser");
        localStorage.removeItem("role");
        handleSuccess("User Logged out successfully");
        setTimeout(() => {
          navigate('/login')
        },1000);
      }
      return (
        <div>
          <h1>Welcome, {loggedInUser}!</h1>
          <button onClick={handleLogout}>Logout</button>
            {/* 🔥 ROLE BASED DASHBOARD  */}
          {/* {role === "job_seeker" && <JobSeekerDashboard />}
          {role === "recruiter" && <RecruiterDashboard />}
          {role === "admin" && <AdminDashboard />} */}

          <ToastContainer/>
        </div>
        
      );
}

export default Home;