import { Link} from 'react-router-dom'
import { ToastContainer } from 'react-toastify';



function Signup() {
  return (
    <div className='container'>
      <h1>Login</h1>
      <form>
        <div>
          <label htmlFor='name'>Name:</label>
          <input 
          type='text' 
          name='name' 
          autoFocus 
          placeholder='Enter your name'
           />
        </div>
        <div>
          <label htmlFor='email'>Email:</label>
          <input 
          type='email' 
          name='email' 
          autoFocus 
          placeholder='Enter your email'
           />
        </div>
        <div>
          <label htmlFor='number'>Number:</label>
          <input 
          type='number' 
          name='number' 
          placeholder='Enter your number'
           />
        </div>
        <div>
          <label htmlFor='password'>Password:</label>
          <input 
          type='password' 
          name='password' 
          placeholder='Enter your password'
           />
        </div>
        
        <button type ='submit'>Signup</button><br></br>
        <span> Already have an account?
          <Link to ="/Login">Login</Link>
        </span>
      </form>
      <ToastContainer/>      
    </div>
  );
}

export default Signup;
