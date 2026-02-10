import { useState } from 'react';
import { Link } from 'react-router-dom'
import { handleError } from '../utils';
import { handleSuccess } from '../utils';
import { useNavigate } from 'react-router-dom';
import { useParams } from "react-router-dom";
import { useMutation } from '@tanstack/react-query';
import { authApi } from '../api/api-client';


function Signup() {
   const { role } = useParams(); // jobseeker | recruiter
   const navigate = useNavigate();
   

   const [signupInfo, setSignupInfo] = useState({
    name: "",
    email: "",
    number: "",
    password: "",
    companyName: "",
  location: "",
    role: role === "recruiter" ? "recruiter" : "job_seeker"
  })

  const signupMutation = useMutation({
    mutationFn: authApi.signup,
    onSuccess: (result: any) => {
      const { success, message, error } = result;
      if (success) {
        handleSuccess(message);
        setTimeout(() => {
          navigate('/login')
        }, 1000)
      } else if (error) {
        const details = error?.details[0].message;
        handleError(details);
      } else if (!success) {
        handleError(message);
      }
    },
    onError: (error: any) => {
      handleError(error.message || 'Signup failed');
    }
  });

//VALIDATION COMES AFTER HOOKS
  if (!role) {
    return null; // wait for router param
  }

  if (role !== "recruiter" && role !== "jobseeker") {
    return <h2>Invalid signup type</h2>;
  }

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    console.log(name, value);
    const copySignupInfo = { ...signupInfo };
    copySignupInfo[name as keyof typeof signupInfo] = value;
    setSignupInfo(copySignupInfo);
  }
  
  const  handleSignup = async (e: any) => {
    e.preventDefault();
    const { name, email, number, password, companyName, location } = signupInfo;

    if (!name || !email || !number || !password) {
      return handleError("All fields are required");
    }
    if (role === "recruiter") {
      if (!companyName || !location) {
          return handleError("Company name and location are required for recruiters");
    }}
    
    // Prepare signup data based on role
    const signupData: any = {
      name,
      email,
      number,
      password,
      role: role === "recruiter" ? "recruiter" : "job_seeker",
    };
    
    // Only add company fields for recruiters
    if (role === "recruiter") {
      signupData.companyName = companyName;
      signupData.location = location;
    }
    
    signupMutation.mutate(signupData);
  }
// ...existing code...
// ...existing code...
  


  return (
    <div className='container'>
      <h1>
        Signup as {role === "recruiter" ? "Recruiter" : "Job Seeker"}
      </h1>
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
        
        {role === "recruiter" && (
          <>
            <div>
              <label htmlFor='companyName'>Company Name:</label>
              <input 
                onChange={handleChange}
                type='text' 
                name='companyName' 
                placeholder='Enter your company name'
                value={signupInfo.companyName}
              />
            </div>
            <div>
              <label htmlFor='location'>Location:</label>
              <input 
                onChange={handleChange}
                type='text' 
                name='location' 
                placeholder='Enter your location'
                value={signupInfo.location}
              />
            </div>
          </>
        )}
        
        <button type='submit' disabled={signupMutation.isPending}>
          {signupMutation.isPending ? 'Signing up...' : 'Signup'}
        </button><br></br>
        <span> Already have an account?
          <Link to="/Login">Login</Link>
        </span>
      </form>
    </div>
  );
}

export default Signup;