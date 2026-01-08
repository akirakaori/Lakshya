import { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';
import { handleSuccess } from "../Utils";
import { ToastContainer } from 'react-toastify';

function AdminDashboard() {
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
      <h1>Admin Dashboard</h1>
      <p>Welcome Admin 👑</p>

      <ul>
        <li>View All Users</li>
        <li>Manage Recruiters</li>
        <li>Manage Job Seekers</li>
      </ul>
      <ToastContainer />
    </div>
  );
}

export default AdminDashboard;
