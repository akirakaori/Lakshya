import { useState } from 'react';
import { Link } from 'react-router-dom'
import { ToastContainer } from 'react-toastify';
import { handleError } from '../utils';
import { handleSuccess } from '../utils';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { authApi } from '../api/api-client';


function Login() {
  
  
  const [loginInfo, setLoginInfo] = useState({
   
    email: "",
    
    password: ""
  })
  const navigate = useNavigate();

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (result: any) => {
      const { success, message, jwtToken, name, role, error } = result;
      if (success) {
        handleSuccess(message);
        localStorage.setItem("token", jwtToken);
        localStorage.setItem("loggedInUser", name);
        localStorage.setItem("role", role);
        
        setTimeout(() => {
          if (role === "admin") {
            navigate("/AdminDashboard", { replace: true });
          } else if (role === "recruiter") {
            navigate("/RecruiterDashboard", { replace: true });
          } else {
            navigate("/JobSeekerDashboard", { replace: true });
          }
        }, 1000);
      } else if (error) {
        const details = error?.details[0].message;
        handleError(details);
      } else if (!success) {
        handleError(message);
      }
    },
    onError: (error: any) => {
      handleError(error.message || 'Login failed');
    }
  });

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    console.log(name, value);
    const copyLoginInfo = { ...loginInfo };
    copyLoginInfo[name as keyof typeof loginInfo] = value;
    setLoginInfo(copyLoginInfo);
  }
  
  const  handleLogin = async (e: any) => {
    e.preventDefault();
    const { email, password } = loginInfo;
    if (!email || !password) {
      return handleError("All fields are required");
    }
    
    loginMutation.mutate(loginInfo);
  }
// ...existing code...
// ...existing code...
  


  return (
    <div className='container'>
      <h1>Login</h1>
      <form onSubmit={handleLogin}>
        
        <div>
          <label htmlFor='email'>Email:</label>
          <input 
            onChange={handleChange}
            type='email' 
            name='email' 
            placeholder='Enter your email'
            value={loginInfo.email}
          />
        </div>
      
        <div>
          <label htmlFor='password'>Password:</label>
          <input 
            onChange={handleChange}
            type='password' 
            name='password' 
            placeholder='Enter your password'
            value={loginInfo.password}
          />
        </div>

        <div style={{ marginBottom: "10px" }}>
          <Link to="/forgot-password">Forgot Password?</Link>
        </div>
        
        <button type='submit' disabled={loginMutation.isPending}>
          {loginMutation.isPending ? 'Logging in...' : 'Login'}
        </button><br></br>
        <span> Don't have an account?
          <Link to="/signup-choice">Signup</Link>
        </span>
      </form>
      <ToastContainer />      
    </div>
  );
}



export default Login;

