import { useState } from 'react';
import { Link } from 'react-router-dom'
import { ToastContainer } from 'react-toastify';
import { handleError } from '../Utils';
import { handleSuccess } from '../Utils';
import { useNavigate } from 'react-router-dom';
import { useParams } from "react-router-dom";


function Signup() {
   const { role } = useParams(); // jobseeker | recruiter
   const navigate = useNavigate(); // Add this line
   

   const [signupInfo, setSignupInfo] = useState({
    name: "",
    email: "",
    number: "",
    password: "",
    companyName: "",
  location: "",
    role: role === "recruiter" ? "recruiter" : "job_seeker"
  })
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
    
    try {
      const url = "http://localhost:3000/auth/signup";
      
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
      
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(signupData),
      });
      const result = await response.json();
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
            console.log(result);
        } catch (err) {
            handleError(err as string | number);
        }
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