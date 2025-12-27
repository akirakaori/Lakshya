import { useState } from 'react';
import { Link } from 'react-router-dom'
import { ToastContainer } from 'react-toastify';
import { handleError } from '../Utils';
import { handleSuccess } from '../Utils';
import { useNavigate } from 'react-router-dom';

function Signup() {
  const navigate = useNavigate(); // Add this line
  
  const [signupInfo, setSignupInfo] = useState({
    name: "",
    email: "",
    number: "",
    password: ""
  })

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    console.log(name, value);
    const copySignupInfo = { ...signupInfo };
    copySignupInfo[name as keyof typeof signupInfo] = value;
    setSignupInfo(copySignupInfo);
  }
  
  const  handleSignup = async (e: any) => {
    e.preventDefault();
    const { name, email, number, password } = signupInfo;
    if (!name || !email || !number || !password) {
      return handleError("All fields are required");
    }
    
    try {
      const url = "http://localhost:3000/auth/signup";
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(signupInfo),
      });
      const result = await response.json();
      if (response.ok) {
        handleSuccess(result.message);
        setTimeout(() => navigate('/login'), 1000);
      } else {
        handleError(result.message || 'Something went wrong');
      }
    } catch (err) {
      handleError(err instanceof Error ? err.message : 'An error occurred');
    }
  }
// ...existing code...
// ...existing code...
  


  return (
    <div className='container'>
      <h1>Signup</h1>
      <form onSubmit={handleSignup}>
        <div>
          <label htmlFor='name'>Name:</label>
          <input 
            onChange={handleChange}
            type='text' 
            name='name' 
            autoFocus 
            placeholder='Enter your name'
            value={signupInfo.name}
          />
        </div>
        <div>
          <label htmlFor='email'>Email:</label>
          <input 
            onChange={handleChange}
            type='email' 
            name='email' 
            placeholder='Enter your email'
            value={signupInfo.email}
          />
        </div>
        <div>
          <label htmlFor='number'>Number:</label>
          <input 
            onChange={handleChange}
            type='number' 
            name='number' 
            placeholder='Enter your number'
            value={signupInfo.number}
          />
        </div>
        <div>
          <label htmlFor='password'>Password:</label>
          <input 
            onChange={handleChange}
            type='password' 
            name='password' 
            placeholder='Enter your password'
            value={signupInfo.password}
          />
        </div>
        
        <button type='submit'>Signup</button><br></br>
        <span> Already have an account?
          <Link to="/Login">Login</Link>
        </span>
      </form>
      <ToastContainer />      
    </div>
  );
}

export default Signup;