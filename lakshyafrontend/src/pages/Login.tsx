import { useState } from 'react';
import { Link } from 'react-router-dom'
import { ToastContainer } from 'react-toastify';
import { handleError } from '../Utils';
import { handleSuccess } from '../Utils';
import { useNavigate } from 'react-router-dom';


function Login() {
  
  
  const [loginInfo, setLoginInfo] = useState({
   
    email: "",
    
    password: ""
  })
  const navigate = useNavigate(); // Add this line

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
    
    try {
      const url = "http://localhost:3000/auth/login";
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(loginInfo),
      });
      const result = await response.json();
       const { success, message,jwtToken,name, error } = result;
            if (success) {
                handleSuccess(message);
                localStorage.setItem("token", result.jwtToken);
                localStorage.setItem("loggedInUser", result.name);
                localStorage.setItem("role", result.role);
                
                setTimeout(() => {
                  if (result.role === "admin") {
                    navigate("/AdminDashboard");
                  } else if (result.role === "recruiter") {
                    navigate("/RecruiterDashboard");
                  } else {
                    navigate("/JobSeekerDashboard");
                  }
                }, 1000);
              } else if (error) {
                const details = error?.details[0].message;
                handleError(details);
            } else if (!success) {
                handleError(message);
            }
            console.log(result);
        } catch (err) {
            handleError(err as string | number);
        }
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
        
        <button type='submit'>Login</button><br></br>
        <span> Don't have an account?
          <Link to="/signup-choice">Signup</Link>
        </span>
      </form>
      <ToastContainer />      
    </div>
  );
}



export default Login;

