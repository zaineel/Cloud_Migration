"use client";

import {
  confirmSignUp,
  signIn,
  signUp,
  resetPassword,
  confirmResetPassword,
  signOut,
  getCurrentUser,
} from "@aws-amplify/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { isAuthAvailable } from "@/lib/amplify-provider";

export default function LoginPage() {
  const [showSignup, setShowSignup] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationEmail, setConfirmationEmail] = useState("");
  const router = useRouter();
  const authConfigured = isAuthAvailable();

  // Forgot password state
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showResetConfirmation, setShowResetConfirmation] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  // Username validation state
  const [usernameStatus, setUsernameStatus] = useState<
    "idle" | "checking" | "available" | "taken" | "invalid"
  >("idle");
  const [usernameError, setUsernameError] = useState("");

  // Remove guest/auto-redirect logic. Only redirect after login/signup.

  // Login form state
  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
  });

  // Signup form state
  const [signupForm, setSignupForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  // Confirmation code state
  const [confirmationCode, setConfirmationCode] = useState("");

  // Username validation function
  const validateUsername = (username: string): boolean => {
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    return usernameRegex.test(username);
  };

  // Check username availability with debouncing
  const checkUsernameAvailability = async (username: string) => {
    if (!username || username.length < 3) {
      setUsernameStatus("idle");
      setUsernameError("");
      return;
    }

    if (!validateUsername(username)) {
      setUsernameStatus("invalid");
      setUsernameError(
        "3-20 characters, letters, numbers, and underscores only"
      );
      return;
    }

    setUsernameStatus("checking");
    setUsernameError("");

    try {
      const response = await fetch(
        `/api/check-username?username=${encodeURIComponent(username)}`
      );
      const data = await response.json();

      if (data.available) {
        setUsernameStatus("available");
        setUsernameError("");
      } else {
        setUsernameStatus("taken");
        setUsernameError(data.error || "Username is already taken");
      }
    } catch {
      setUsernameStatus("idle");
      setUsernameError("Could not check availability");
    }
  };

  // Debounced username check using useRef and useEffect
  const usernameTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleUsernameChange = (username: string) => {
    setSignupForm({ ...signupForm, username });
    setUsernameStatus("idle");

    // Clear any existing timeout
    if (usernameTimeoutRef.current) {
      clearTimeout(usernameTimeoutRef.current);
    }

    // Set new timeout for debounced check
    usernameTimeoutRef.current = setTimeout(() => {
      checkUsernameAvailability(username);
    }, 500);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (usernameTimeoutRef.current) {
        clearTimeout(usernameTimeoutRef.current);
      }
    };
  }, []);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (!authConfigured) {
      setError(
        "Authentication not configured. Please set up AWS Cognito environment variables."
      );
      setIsLoading(false);
      return;
    }

    try {
      // Check if there's already a signed-in user
      try {
        await getCurrentUser();
        // User is already signed in, sign them out first
        await signOut();
      } catch {
        // No user signed in, proceed with login
      }

      await signIn({
        username: loginForm.email,
        password: loginForm.password,
      });
      setSuccess("Login successful! Redirecting...");

      // Small delay to ensure session is established
      setTimeout(() => {
        router.push("/home");
      }, 500);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message || "Login failed. Please try again.");
      } else {
        setError("Login failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (!authConfigured) {
      setError(
        "Authentication not configured. Please set up AWS Cognito environment variables."
      );
      setIsLoading(false);
      return;
    }

    // Validate username
    if (!signupForm.username || !validateUsername(signupForm.username)) {
      setError(
        "Please enter a valid username (3-20 characters, letters, numbers, and underscores only)."
      );
      setIsLoading(false);
      return;
    }

    // Check if username is available
    if (usernameStatus === "taken" || usernameStatus === "invalid") {
      setError("Please choose a different username.");
      setIsLoading(false);
      return;
    }

    if (signupForm.password !== signupForm.confirmPassword) {
      setError("Passwords do not match.");
      setIsLoading(false);
      return;
    }

    try {
      // First, try to reserve the username in DynamoDB
      const reserveResponse = await fetch("/api/check-username", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: signupForm.username,
          userId: signupForm.email, // Temporary, will be updated after Cognito signup
          email: signupForm.email,
        }),
      });

      if (!reserveResponse.ok) {
        const reserveData = await reserveResponse.json();
        if (reserveResponse.status === 409) {
          setUsernameStatus("taken");
          setError("This username was just taken. Please choose another.");
          setIsLoading(false);
          return;
        }
        throw new Error(reserveData.error || "Failed to reserve username");
      }

      // Now sign up with Cognito
      await signUp({
        username: signupForm.email,
        password: signupForm.password,
        options: {
          userAttributes: {
            email: signupForm.email,
            preferred_username: signupForm.username,
          },
        },
      });
      setConfirmationEmail(signupForm.email);
      setShowConfirmation(true);
      setSuccess(
        "Account created! Please check your email for a verification code."
      );
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message || "Signup failed. Please try again.");
      } else {
        setError("Signup failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (!authConfigured) {
      setError(
        "Authentication not configured. Please set up AWS Cognito environment variables."
      );
      setIsLoading(false);
      return;
    }

    try {
      await confirmSignUp({
        username: confirmationEmail,
        confirmationCode: confirmationCode,
      });
      setSuccess("Email verified! You can now sign in.");
      setShowConfirmation(false);
      setShowSignup(false);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message || "Verification failed. Please try again.");
      } else {
        setError("Verification failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    if (!authConfigured) {
      setError(
        "Authentication not configured. Please set up AWS Cognito environment variables."
      );
      setIsLoading(false);
      return;
    }

    try {
      console.log("Attempting password reset for:", forgotPasswordEmail);
      const result = await resetPassword({ username: forgotPasswordEmail });
      console.log("Reset password result:", result);

      // Check the next step from the result
      if (
        result.nextStep?.resetPasswordStep ===
        "CONFIRM_RESET_PASSWORD_WITH_CODE"
      ) {
        const deliveryDetails = result.nextStep.codeDeliveryDetails;
        setShowResetConfirmation(true);
        setSuccess(
          `Reset code sent to ${
            deliveryDetails?.destination || "your email"
          }! Check your inbox (and spam folder).`
        );
      } else {
        setShowResetConfirmation(true);
        setSuccess(
          "Reset code sent! Check your email for the verification code."
        );
      }
    } catch (err: unknown) {
      console.error("Password reset error:", err);
      if (err instanceof Error) {
        // Provide more helpful error messages
        const errorMessage = err.message;
        if (
          errorMessage.includes("UserNotFoundException") ||
          (errorMessage.includes("user") && errorMessage.includes("not found"))
        ) {
          setError(
            "No account found with this email. Please check the email address or sign up first."
          );
        } else if (errorMessage.includes("LimitExceededException")) {
          setError(
            "Too many attempts. Please wait a few minutes and try again."
          );
        } else if (errorMessage.includes("InvalidParameterException")) {
          setError("Invalid email format. Please enter a valid email address.");
        } else {
          setError(
            errorMessage || "Failed to send reset code. Please try again."
          );
        }
      } else {
        setError("Failed to send reset code. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmResetPassword = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    if (!authConfigured) {
      setError(
        "Authentication not configured. Please set up AWS Cognito environment variables."
      );
      setIsLoading(false);
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setError("Passwords do not match.");
      setIsLoading(false);
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long.");
      setIsLoading(false);
      return;
    }

    try {
      await confirmResetPassword({
        username: forgotPasswordEmail,
        confirmationCode: resetCode,
        newPassword: newPassword,
      });
      setSuccess(
        "Password reset successful! You can now sign in with your new password."
      );
      // Reset all forgot password states and go back to login
      setShowForgotPassword(false);
      setShowResetConfirmation(false);
      setForgotPasswordEmail("");
      setResetCode("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message || "Failed to reset password. Please try again.");
      } else {
        setError("Failed to reset password. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setShowForgotPassword(false);
    setShowResetConfirmation(false);
    setForgotPasswordEmail("");
    setResetCode("");
    setNewPassword("");
    setConfirmNewPassword("");
    setError("");
    setSuccess("");
  };

  return (
    <div className="min-h-screen bg-black flex">
      {/* Left Side - MavPrep Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-black relative overflow-hidden items-center justify-center">
        {/* Animated neon background */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        {/* MavPrep Logo */}
        <div className="relative z-10 text-center">
          <div className="flex items-center justify-center mb-6">
            <span className="text-7xl font-bold text-gray-300 tracking-wide">
              Mav
            </span>
            <span className="text-7xl font-bold text-white tracking-wide neon-text-glow">
              Prep
            </span>
          </div>
          <p className="text-gray-400 text-xl max-w-md">
            Your intelligent companion for academic success
          </p>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Back to Home Link */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-primary transition-colors mb-8"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to Home
          </Link>

          {showForgotPassword && !showResetConfirmation ? (
            /* Forgot Password - Enter Email Form */
            <form onSubmit={handleForgotPassword}>
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-white mb-1 tracking-tight">
                  Reset Password
                </h2>
                <p className="text-gray-400 text-sm">
                  Enter your email to receive a password reset code
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-900/50 border border-red-600 rounded-lg">
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              )}

              {success && (
                <div className="mb-4 p-3 bg-green-900/50 border border-green-600 rounded-lg">
                  <p className="text-green-300 text-sm">{success}</p>
                </div>
              )}

              <div className="space-y-3">
                <div className="p-4 border border-gray-700 rounded-xl bg-gray-900/50">
                  <input
                    type="email"
                    value={forgotPasswordEmail}
                    onChange={(e) => setForgotPasswordEmail(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary transition-colors"
                    placeholder="Enter your email address"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full px-4 py-2 text-sm bg-primary text-black font-semibold rounded-lg hover:bg-accent transition-all neon-glow disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Sending..." : "Send Reset Code"}
                </button>

                <p className="text-center text-gray-400 text-xs mt-4">
                  Remember your password?{" "}
                  <button
                    type="button"
                    onClick={handleBackToLogin}
                    className="text-primary hover:text-accent transition-colors font-medium"
                  >
                    Back to Sign In
                  </button>
                </p>
              </div>
            </form>
          ) : showForgotPassword && showResetConfirmation ? (
            /* Reset Password - Enter Code and New Password Form */
            <form onSubmit={handleConfirmResetPassword}>
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-white mb-1 tracking-tight">
                  Set New Password
                </h2>
                <p className="text-gray-400 text-sm">
                  Enter the code sent to {forgotPasswordEmail}
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-900/50 border border-red-600 rounded-lg">
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              )}

              {success && (
                <div className="mb-4 p-3 bg-green-900/50 border border-green-600 rounded-lg">
                  <p className="text-green-300 text-sm">{success}</p>
                </div>
              )}

              <div className="space-y-3">
                <div className="p-4 border border-gray-700 rounded-xl bg-gray-900/50">
                  {/* Reset Code Input */}
                  <div className="mb-3">
                    <input
                      type="text"
                      value={resetCode}
                      onChange={(e) => setResetCode(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary transition-colors text-center tracking-wider"
                      placeholder="Enter 6-digit code"
                      maxLength={6}
                      required
                    />
                  </div>

                  {/* New Password Input */}
                  <div className="mb-3">
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary transition-colors"
                      placeholder="Enter new password"
                      minLength={8}
                      required
                    />
                  </div>

                  {/* Confirm New Password Input */}
                  <div>
                    <input
                      type="password"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary transition-colors"
                      placeholder="Confirm new password"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full px-4 py-2 text-sm bg-primary text-black font-semibold rounded-lg hover:bg-accent transition-all neon-glow disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Resetting..." : "Reset Password"}
                </button>

                <p className="text-center text-gray-400 text-xs mt-4">
                  Didn&apos;t receive a code?{" "}
                  <button
                    type="button"
                    onClick={() => setShowResetConfirmation(false)}
                    className="text-primary hover:text-accent transition-colors font-medium"
                  >
                    Resend code
                  </button>
                </p>
              </div>
            </form>
          ) : !showSignup && !showConfirmation ? (
            /* Login Form */
            <form onSubmit={handleLogin}>
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-white mb-1 tracking-tight">
                  Welcome Back
                </h2>
                <p className="text-gray-400 text-sm">
                  Sign in with UTA email to continue to MavPrep
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-900/50 border border-red-600 rounded-lg">
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              )}

              {success && (
                <div className="mb-4 p-3 bg-green-900/50 border border-green-600 rounded-lg">
                  <p className="text-green-300 text-sm">{success}</p>
                </div>
              )}

              <div className="space-y-3">
                {/* Login Credentials Border */}
                <div className="p-4 border border-gray-700 rounded-xl bg-gray-900/50">
                  {/* Username/Email Input */}
                  <div className="mb-3">
                    <input
                      type="email"
                      id="username"
                      value={loginForm.email}
                      onChange={(e) =>
                        setLoginForm({ ...loginForm, email: e.target.value })
                      }
                      className="w-full px-3 py-2 text-sm bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary transition-colors"
                      placeholder="Enter your UTA email (example@mavs.uta.edu)"
                      required
                    />
                  </div>

                  {/* Password Input */}
                  <div>
                    <input
                      type="password"
                      id="password"
                      value={loginForm.password}
                      onChange={(e) =>
                        setLoginForm({ ...loginForm, password: e.target.value })
                      }
                      className="w-full px-3 py-2 text-sm bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary transition-colors"
                      placeholder="Enter your password"
                      required
                    />
                  </div>
                </div>

                {/* Forgot Password Link */}
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotPassword(true);
                      setError("");
                      setSuccess("");
                    }}
                    className="text-xs text-primary hover:text-accent transition-colors"
                  >
                    Forgot Password?
                  </button>
                </div>

                {/* Login Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full px-4 py-2 text-sm bg-primary text-black font-semibold rounded-lg hover:bg-accent transition-all neon-glow disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Signing In..." : "Sign In"}
                </button>

                {/* Sign Up Link */}
                <p className="text-center text-gray-400 text-xs mt-4">
                  Don&apos;t have an account?{" "}
                  <button
                    type="button"
                    onClick={() => setShowSignup(true)}
                    className="text-primary hover:text-accent transition-colors font-medium"
                  >
                    Sign up
                  </button>
                </p>
              </div>
            </form>
          ) : showConfirmation ? (
            /* Email Confirmation Form */
            <form onSubmit={handleConfirmSignup}>
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-white mb-1 tracking-tight">
                  Verify Your Email
                </h2>
                <p className="text-gray-400 text-sm">
                  Enter the verification code sent to {confirmationEmail}
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-900/50 border border-red-600 rounded-lg">
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              )}

              {success && (
                <div className="mb-4 p-3 bg-green-900/50 border border-green-600 rounded-lg">
                  <p className="text-green-300 text-sm">{success}</p>
                </div>
              )}

              <div className="space-y-3">
                <div className="p-4 border border-gray-700 rounded-xl bg-gray-900/50">
                  <input
                    type="text"
                    value={confirmationCode}
                    onChange={(e) => setConfirmationCode(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary transition-colors text-center tracking-wider"
                    placeholder="Enter 6-digit code"
                    maxLength={6}
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full px-4 py-2 text-sm bg-primary text-black font-semibold rounded-lg hover:bg-accent transition-all neon-glow disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Verifying..." : "Verify Email"}
                </button>

                <p className="text-center text-gray-400 text-xs mt-4">
                  Didn&apos;t receive a code?{" "}
                  <button
                    type="button"
                    onClick={() => setShowConfirmation(false)}
                    className="text-primary hover:text-accent transition-colors font-medium"
                  >
                    Go back
                  </button>
                </p>
              </div>
            </form>
          ) : (
            /* Signup Form */
            <form onSubmit={handleSignup}>
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-white mb-1 tracking-tight">
                  Create Account
                </h2>
                <p className="text-gray-400 text-sm">
                  Sign up with UTA email to get started with MavPrep
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-900/50 border border-red-600 rounded-lg">
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              )}

              {success && (
                <div className="mb-4 p-3 bg-green-900/50 border border-green-600 rounded-lg">
                  <p className="text-green-300 text-sm">{success}</p>
                </div>
              )}

              <div className="space-y-3">
                {/* Signup Credentials Border */}
                <div className="p-4 border border-gray-700 rounded-xl bg-gray-900/50">
                  {/* Username Input */}
                  <div className="mb-3">
                    <div className="relative">
                      <input
                        type="text"
                        id="signup-username"
                        value={signupForm.username}
                        onChange={(e) => handleUsernameChange(e.target.value)}
                        className={`w-full px-3 py-2 text-sm bg-gray-900 border rounded-lg text-white placeholder-gray-500 focus:outline-none transition-colors pr-10 ${
                          usernameStatus === "available"
                            ? "border-green-500 focus:border-green-500"
                            : usernameStatus === "taken" ||
                              usernameStatus === "invalid"
                            ? "border-red-500 focus:border-red-500"
                            : "border-gray-700 focus:border-primary"
                        }`}
                        placeholder="Choose a username"
                        minLength={3}
                        maxLength={20}
                        required
                      />
                      {/* Status indicator */}
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {usernameStatus === "checking" && (
                          <svg
                            className="w-4 h-4 text-gray-400 animate-spin"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                        )}
                        {usernameStatus === "available" && (
                          <svg
                            className="w-4 h-4 text-green-500"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        )}
                        {(usernameStatus === "taken" ||
                          usernameStatus === "invalid") && (
                          <svg
                            className="w-4 h-4 text-red-500"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        )}
                      </div>
                    </div>
                    {/* Username helper text */}
                    <p
                      className={`text-xs mt-1 ${
                        usernameStatus === "available"
                          ? "text-green-400"
                          : usernameStatus === "taken" ||
                            usernameStatus === "invalid"
                          ? "text-red-400"
                          : "text-gray-500"
                      }`}
                    >
                      {usernameStatus === "available"
                        ? "✓ Username is available"
                        : usernameStatus === "taken"
                        ? "✗ Username is already taken"
                        : usernameStatus === "invalid"
                        ? usernameError
                        : "3-20 characters, letters, numbers, and underscores"}
                    </p>
                  </div>

                  {/* Email Input */}
                  <div className="mb-3">
                    <input
                      type="email"
                      id="signup-email"
                      value={signupForm.email}
                      onChange={(e) =>
                        setSignupForm({ ...signupForm, email: e.target.value })
                      }
                      className="w-full px-3 py-2 text-sm bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary transition-colors"
                      placeholder="Enter your UTA email (example@mavs.uta.edu)"
                      required
                    />
                  </div>

                  {/* Password Input */}
                  <div className="mb-3">
                    <input
                      type="password"
                      id="signup-password"
                      value={signupForm.password}
                      onChange={(e) =>
                        setSignupForm({
                          ...signupForm,
                          password: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 text-sm bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary transition-colors"
                      placeholder="Create a password"
                      minLength={8}
                      required
                    />
                  </div>

                  {/* Confirm Password Input */}
                  <div>
                    <input
                      type="password"
                      id="signup-confirm-password"
                      value={signupForm.confirmPassword}
                      onChange={(e) =>
                        setSignupForm({
                          ...signupForm,
                          confirmPassword: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 text-sm bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary transition-colors"
                      placeholder="Confirm your password"
                      required
                    />
                  </div>
                </div>

                {/* Sign Up Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full px-4 py-2 text-sm bg-primary text-black font-semibold rounded-lg hover:bg-accent transition-all neon-glow mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Creating Account..." : "Create Account"}
                </button>

                {/* Sign In Link */}
                <p className="text-center text-gray-400 text-xs mt-4">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => setShowSignup(false)}
                    className="text-primary hover:text-accent transition-colors font-medium"
                  >
                    Sign in
                  </button>
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
