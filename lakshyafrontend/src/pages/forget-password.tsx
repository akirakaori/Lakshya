import { useState } from "react";
import { handleError, handleSuccess } from "../utils";
import { useNavigate } from "react-router-dom";
import { useMutation } from '@tanstack/react-query';
import { authApi } from '../api/api-client';

function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");

  const forgotPasswordMutation = useMutation({
    mutationFn: authApi.forgotPassword,
    onSuccess: (data: any) => {
      if (data.success) {
        handleSuccess(data.message);
        // Auto-navigate
        setTimeout(() => {
          navigate("/reset-password", {
            state: { email },
          });
        }, 1000);
      } else {
        handleError(data.message);
      }
    },
    onError: () => {
      handleError("Something went wrong");
    }
  });

  const sendOtp = async () => {
    if (!email) {
      return handleError("Email is required");
    }
    
    forgotPasswordMutation.mutate(email);
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

      <button onClick={sendOtp} disabled={forgotPasswordMutation.isPending}>
        {forgotPasswordMutation.isPending ? "Sending..." : "Send OTP"}
      </button>

      <button type="button" onClick={sendOtp} disabled={forgotPasswordMutation.isPending}>
        Resend OTP
      </button>
    </div>
  );
}

export default ForgotPassword;
