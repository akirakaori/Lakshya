import { useNavigate } from "react-router-dom";

function SignupChoice() {
  const navigate = useNavigate();

  return (
    <div className="container">
      <h1>Signup as</h1>

      <button onClick={() => navigate("/signup/jobseeker")}>
        Job Seeker
      </button>

      <br /><br />

      <button onClick={() => navigate("/signup/recruiter")}>
        Recruiter
      </button>
    </div>
  );
}

export default SignupChoice;
