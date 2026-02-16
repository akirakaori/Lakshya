import { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';
import { handleSuccess } from "../utils";

function Home() {

      const [loggedInUser, setLoggedInUser] = useState('');
      const navigate = useNavigate();

      useEffect(() => {
        setLoggedInUser(localStorage.getItem("loggedInUser") || '');
      }, [])
      const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("loggedInUser");
        localStorage.removeItem("role");
        handleSuccess("User Logged out successfully");
        setTimeout(() => {
          navigate('/login', { replace: true })
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
        </div>
        
      );
}

export default Home;