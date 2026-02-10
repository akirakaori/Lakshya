import { useState } from "react";
import { handleError, handleSuccess } from "../utils";
import { useNavigate } from "react-router-dom";
import { useMutation } from '@tanstack/react-query';
import { authApi } from '../api/api-client';

function ResetPassword() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const navigate = useNavigate();

  const resetPasswordMutation = useMutation({
    mutationFn: authApi.resetPassword,
    onSuccess: (data: any) => {
      if (data.success) {
        handleSuccess(data.message);
        setTimeout(() => navigate("/login"), 1500);
      } else {
        handleError(data.message);
      }
    },
    onError: () => {
      handleError("Something went wrong");
    }
  });

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    if (!email || !otp || !newPassword) {
      return handleError("All fields are required");
    }

    resetPasswordMutation.mutate({ email, otp, newPassword });
  };

  return (
    <div className="container">
      <h1>Reset Password</h1>

      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="text"
          placeholder="OTP"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
        />

        <input
          type="password"
          placeholder="New Password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />

        <button type="submit" disabled={resetPasswordMutation.isPending}>
          {resetPasswordMutation.isPending ? 'Resetting...' : 'Reset Password'}
        </button>
      </form>
    </div>
  );
}

export default ResetPassword;
