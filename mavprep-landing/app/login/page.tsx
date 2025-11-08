"use client";

import Link from "next/link";
import { useState } from "react";

export default function LoginPage() {
  const [showSignup, setShowSignup] = useState(false);

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

          {!showSignup ? (
            /* Login Form */
            <div>
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-white mb-1 tracking-tight">
                  Welcome Back
                </h2>
                <p className="text-gray-400 text-sm">
                  Sign in to continue to MavPrep
                </p>
              </div>

              <div className="space-y-3">
                {/* Login Credentials Border */}
                <div className="p-4 border border-gray-700 rounded-xl bg-gray-900/50">
                  {/* Username/Email Input */}
                  <div className="mb-3">
                    <input
                      type="text"
                      id="username"
                      className="w-full px-3 py-2 text-sm bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary transition-colors"
                      placeholder="Enter your username or email"
                    />
                  </div>

                  {/* Password Input */}
                  <div>
                    <input
                      type="password"
                      id="password"
                      className="w-full px-3 py-2 text-sm bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary transition-colors"
                      placeholder="Enter your password"
                    />
                  </div>
                </div>

                {/* Forgot Password Link */}
                <div className="flex justify-end">
                  <Link
                    href="#"
                    className="text-xs text-primary hover:text-accent transition-colors"
                  >
                    Forgot Password?
                  </Link>
                </div>

                {/* Login Button */}
                <button className="w-full px-4 py-2 text-sm bg-primary text-black font-semibold rounded-lg hover:bg-accent transition-all neon-glow">
                  Sign In
                </button>

                {/* Divider */}
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-700"></div>
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="px-3 bg-black text-gray-400">
                      Or continue with
                    </span>
                  </div>
                </div>

                {/* Social Login Buttons */}
                <div className="space-y-2">
                  {/* Google Login */}
                  <button className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm bg-black border border-gray-700 rounded-lg text-white hover:border-primary hover:bg-gray-800 transition-all group">
                    <svg
                      className="w-4 h-4"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                    <span>Continue with Google</span>
                  </button>

                  {/* Microsoft Login */}
                  <button className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm bg-black border border-gray-700 rounded-lg text-white hover:border-primary hover:bg-gray-800 transition-all group">
                    <svg className="w-4 h-4" viewBox="0 0 23 23" fill="none">
                      <path d="M0 0h11v11H0z" fill="#f25022" />
                      <path d="M12 0h11v11H12z" fill="#00a4ef" />
                      <path d="M0 12h11v11H0z" fill="#7fba00" />
                      <path d="M12 12h11v11H12z" fill="#ffb900" />
                    </svg>
                    <span>Continue with Microsoft</span>
                  </button>

                  {/* Apple Login */}
                  <button className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm bg-black border border-gray-700 rounded-lg text-white hover:border-primary hover:bg-gray-800 transition-all group">
                    <svg
                      className="w-4 h-4"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path
                        d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"
                        fill="white"
                      />
                    </svg>
                    <span>Continue with Apple</span>
                  </button>

                  {/* Guest Login */}
                  <button className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm bg-black border border-gray-700 rounded-lg text-white hover:border-primary hover:bg-gray-800 transition-all group">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    <span>Continue as Guest</span>
                  </button>
                </div>

                {/* Sign Up Link */}
                <p className="text-center text-gray-400 text-xs mt-4">
                  Don&apos;t have an account?{" "}
                  <button
                    onClick={() => setShowSignup(true)}
                    className="text-primary hover:text-accent transition-colors font-medium"
                  >
                    Sign up
                  </button>
                </p>
              </div>
            </div>
          ) : (
            /* Signup Form */
            <div>
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-white mb-1 tracking-tight">
                  Create Account
                </h2>
                <p className="text-gray-400 text-sm">
                  Sign up to get started with MavPrep
                </p>
              </div>

              <div className="space-y-3">
                {/* Signup Credentials Border */}
                <div className="p-4 border border-gray-700 rounded-xl bg-gray-900/50">
                  {/* Username Input */}
                  <div className="mb-3">
                    <input
                      type="text"
                      id="signup-username"
                      className="w-full px-3 py-2 text-sm bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary transition-colors"
                      placeholder="Choose a username"
                    />
                  </div>

                  {/* Email Input */}
                  <div className="mb-3">
                    <input
                      type="email"
                      id="signup-email"
                      className="w-full px-3 py-2 text-sm bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary transition-colors"
                      placeholder="Enter your email"
                    />
                  </div>

                  {/* Password Input */}
                  <div className="mb-3">
                    <input
                      type="password"
                      id="signup-password"
                      className="w-full px-3 py-2 text-sm bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary transition-colors"
                      placeholder="Create a password"
                    />
                  </div>

                  {/* Confirm Password Input */}
                  <div>
                    <input
                      type="password"
                      id="signup-confirm-password"
                      className="w-full px-3 py-2 text-sm bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary transition-colors"
                      placeholder="Confirm your password"
                    />
                  </div>
                </div>

                {/* Sign Up Button */}
                <button className="w-full px-4 py-2 text-sm bg-primary text-black font-semibold rounded-lg hover:bg-accent transition-all neon-glow mt-2">
                  Create Account
                </button>

                {/* Divider */}
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-700"></div>
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="px-3 bg-black text-gray-400">
                      Or sign up with
                    </span>
                  </div>
                </div>

                {/* Social Signup Buttons */}
                <div className="space-y-2">
                  {/* Google Signup */}
                  <button className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm bg-black border border-gray-700 rounded-lg text-white hover:border-primary hover:bg-gray-800 transition-all group">
                    <svg
                      className="w-4 h-4"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                    <span>Sign up with Google</span>
                  </button>

                  {/* Microsoft Signup */}
                  <button className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm bg-black border border-gray-700 rounded-lg text-white hover:border-primary hover:bg-gray-800 transition-all group">
                    <svg className="w-4 h-4" viewBox="0 0 23 23" fill="none">
                      <path d="M0 0h11v11H0z" fill="#f25022" />
                      <path d="M12 0h11v11H12z" fill="#00a4ef" />
                      <path d="M0 12h11v11H0z" fill="#7fba00" />
                      <path d="M12 12h11v11H12z" fill="#ffb900" />
                    </svg>
                    <span>Sign up with Microsoft</span>
                  </button>

                  {/* Apple Signup */}
                  <button className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm bg-black border border-gray-700 rounded-lg text-white hover:border-primary hover:bg-gray-800 transition-all group">
                    <svg
                      className="w-4 h-4"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path
                        d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"
                        fill="white"
                      />
                    </svg>
                    <span>Sign up with Apple</span>
                  </button>
                </div>

                {/* Sign In Link */}
                <p className="text-center text-gray-400 text-xs mt-4">
                  Already have an account?{" "}
                  <button
                    onClick={() => setShowSignup(false)}
                    className="text-primary hover:text-accent transition-colors font-medium"
                  >
                    Sign in
                  </button>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
