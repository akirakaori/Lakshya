import { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';
import { handleSuccess } from "../utils";
import { ConfirmModal } from "../components/ui";

function Home() {

      const [loggedInUser, setLoggedInUser] = useState('');
      const [showLogoutModal, setShowLogoutModal] = useState(false);
      const navigate = useNavigate();

      useEffect(() => {
        setLoggedInUser(localStorage.getItem("loggedInUser") || '');
      }, [])
      
      const handleLogout = () => {
        setShowLogoutModal(true);
      }
      
      const handleConfirmLogout = () => {
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
          
          <ConfirmModal
            isOpen={showLogoutModal}
            onClose={() => setShowLogoutModal(false)}
            onConfirm={handleConfirmLogout}
            title="Logout Confirmation"
            message="Are you sure you want to logout? You will need to login again to access your account."
            confirmText="Logout"
            cancelText="Cancel"
            confirmButtonClass="bg-red-600 hover:bg-red-700 text-white"
          />
        </div>
        
      );
}

export default Home;