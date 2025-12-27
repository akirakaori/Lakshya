import { useNavigate } from "react-router-dom";

function Landing() {
  const navigate = useNavigate();

  return (
    <div className="container">
      <h1>Welcome to Lakshya 🚀</h1>

      <button onClick={() => navigate("/login")}>
        Login
      </button>

      <br /><br />

      <button onClick={() => navigate("/signup-choice")}>
        Signup
      </button>
    </div>
  );
}

export default Landing;
