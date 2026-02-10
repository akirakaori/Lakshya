import { useState } from "react";
import { handleError, handleSuccess } from "../utils";
import { ToastContainer } from "react-toastify";
import { useNavigate } from "react-router-dom";

function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const sendOtp = async () => {
    if (!email) {
      return handleError("Email is required");
    }

    try {
      setLoading(true);

      const res = await fetch("http://localhost:3000/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (data.success) {
        handleSuccess(data.message);

        // ✅ AUTO-NAVIGATE
        setTimeout(() => {
          navigate("/reset-password", {
            state: { email }, // pass email
          });
        }, 1000);
      } else {
        handleError(data.message);
      }
    } catch (err) {
      handleError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>Forgot Password</h1>

      <input
        type="email"
        placeholder="Enter your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <button onClick={sendOtp} disabled={loading}>
        {loading ? "Sending..." : "Send OTP"}
      </button>

      <button type="button" onClick={sendOtp}>
        Resend OTP
      </button>

      <ToastContainer />
    </div>
  );
}

export default ForgotPassword;
