import { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';
import { handleSuccess } from "../utils";

function RecruiterDashboard() {
  const [loggedInUser, setLoggedInUser] = useState('');
  const [role, setRole] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    setLoggedInUser(localStorage.getItem("loggedInUser") || '');
    setRole(localStorage.getItem("role"));
  }, [])

  const handleLogout = (e: any) => {
    localStorage.removeItem("token");
    localStorage.removeItem("loggedInUser");
    localStorage.removeItem("role");
    handleSuccess("User Logged out successfully");
    setTimeout(() => {
      navigate('/login', { replace: true })
    }, 1000);
  }

  return (
    <div>
      <h1>Welcome, {loggedInUser}!</h1>
      <button onClick={handleLogout}>Logout</button>
      <h2>Recruiter Dashboard</h2>
      <p>Post jobs, manage candidates</p>
    </div>
  );
}

export default RecruiterDashboard;
