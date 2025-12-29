"use client";

import { useState, useEffect, useRef } from "react";
import { updatePassword, updateUserAttributes, getCurrentUser, fetchUserAttributes } from "@aws-amplify/auth";
import Link from "next/link";
import AuthGuard from "../../components/AuthGuard";

export default function SettingsPage() {
  // Current user info
  const [currentUserInfo, setCurrentUserInfo] = useState<{
    userId: string;
    email: string;
    currentUsername: string;
    currentDescription: string;
  } | null>(null);

  const DESCRIPTION_MAX_LENGTH = 50;

  // Form states
  const [username, setUsername] = useState("");
  const [description, setDescription] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Username validation state
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken" | "invalid">("idle");
  const usernameTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // UI states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeTab, setActiveTab] = useState<"profile" | "security">("profile");

  // Fetch current user info on mount
  useEffect(() => {
    async function fetchCurrentUser() {
      try {
        const user = await getCurrentUser();
        const attributes = await fetchUserAttributes();
        setCurrentUserInfo({
          userId: user.userId,
          email: attributes.email || "",
          currentUsername: attributes.preferred_username || "",
          currentDescription: attributes["custom:description"] || "",
        });
      } catch (error) {
        console.error("Error fetching user info:", error);
      }
    }
    fetchCurrentUser();
  }, []);

  // Username validation
  const validateUsername = (username: string): boolean => {
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    return usernameRegex.test(username);
  };

  const checkUsernameAvailability = async (newUsername: string) => {
    if (!newUsername || newUsername.length < 3) {
      setUsernameStatus("idle");
      return;
    }

    // If same as current username, it's available
    if (currentUserInfo && newUsername.toLowerCase() === currentUserInfo.currentUsername.toLowerCase()) {
      setUsernameStatus("available");
      return;
    }

    if (!validateUsername(newUsername)) {
      setUsernameStatus("invalid");
      return;
    }

    setUsernameStatus("checking");

    try {
      const response = await fetch(`/api/check-username?username=${encodeURIComponent(newUsername)}`);
      const data = await response.json();
      setUsernameStatus(data.available ? "available" : "taken");
    } catch {
      setUsernameStatus("idle");
    }
  };

  const handleUsernameChange = (newUsername: string) => {
    setUsername(newUsername);
    setUsernameStatus("idle");

    if (usernameTimeoutRef.current) {
      clearTimeout(usernameTimeoutRef.current);
    }

    usernameTimeoutRef.current = setTimeout(() => {
      checkUsernameAvailability(newUsername);
    }, 500);
  };

  useEffect(() => {
    return () => {
      if (usernameTimeoutRef.current) {
        clearTimeout(usernameTimeoutRef.current);
      }
    };
  }, []);

  async function handleUpdateProfile(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const attributes: Record<string, string> = {};
      const newUsername = username.trim();

      if (newUsername) {
        // Validate username format
        if (!validateUsername(newUsername)) {
          setError("Username must be 3-20 characters, letters, numbers, and underscores only.");
          setIsLoading(false);
          return;
        }

        // Check if username is available (unless it's the same as current)
        if (currentUserInfo && newUsername.toLowerCase() !== currentUserInfo.currentUsername.toLowerCase()) {
          if (usernameStatus === "taken") {
            setError("This username is already taken.");
            setIsLoading(false);
            return;
          }

          // Reserve new username in DynamoDB
          const reserveResponse = await fetch("/api/check-username", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              username: newUsername,
              userId: currentUserInfo.userId,
              email: currentUserInfo.email,
            }),
          });

          if (!reserveResponse.ok) {
            const data = await reserveResponse.json();
            if (reserveResponse.status === 409) {
              setUsernameStatus("taken");
              setError("This username was just taken. Please choose another.");
              setIsLoading(false);
              return;
            }
            throw new Error(data.error || "Failed to update username");
          }

          // Delete old username reservation if it exists
          if (currentUserInfo.currentUsername) {
            await fetch("/api/update-username", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                oldUsername: currentUserInfo.currentUsername,
                newUsername: newUsername,
                userId: currentUserInfo.userId,
              }),
            });
          }
        }

        attributes.preferred_username = newUsername;
      }

      const newDescription = description.trim();
      if (newDescription) {
        if (newDescription.length > DESCRIPTION_MAX_LENGTH) {
          setError(`Description must be ${DESCRIPTION_MAX_LENGTH} characters or less.`);
          setIsLoading(false);
          return;
        }
        attributes["custom:description"] = newDescription;
      }

      if (Object.keys(attributes).length === 0) {
        setError("Please enter at least one field to update.");
        setIsLoading(false);
        return;
      }

      // Update Cognito
      await updateUserAttributes({
        userAttributes: attributes,
      });

      // Update description in DynamoDB if changed
      if (newDescription && currentUserInfo) {
        try {
          await fetch("/api/update-profile", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              username: currentUserInfo.currentUsername || newUsername,
              description: newDescription,
            }),
          });
        } catch (dbError) {
          console.error("Failed to update description in DynamoDB:", dbError);
          // Don't fail the whole update if DynamoDB fails - Cognito is the source of truth
        }
      }

      // Update local state
      if (currentUserInfo) {
        setCurrentUserInfo({
          ...currentUserInfo,
          currentUsername: newUsername || currentUserInfo.currentUsername,
          currentDescription: newDescription || currentUserInfo.currentDescription,
        });
      }

      setSuccess("Profile updated successfully!");
      setUsername("");
      setDescription("");
      setUsernameStatus("idle");
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to update profile. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      setIsLoading(false);
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long.");
      setIsLoading(false);
      return;
    }

    try {
      await updatePassword({
        oldPassword: currentPassword,
        newPassword: newPassword,
      });

      setSuccess("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      if (err instanceof Error) {
        if (err.message.includes("Incorrect")) {
          setError("Current password is incorrect.");
        } else {
          setError(err.message);
        }
      } else {
        setError("Failed to change password. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/home"
              className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
              title="Back to Home"
            >
              <svg
                className="w-5 h-5 text-gray-400"
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
            </Link>
            <h1 className="text-xl font-semibold">User Settings</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Tab Navigation */}
        <div className="flex gap-1 mb-8 bg-gray-900 p-1 rounded-lg w-fit">
          <button
            onClick={() => {
              setActiveTab("profile");
              setError("");
              setSuccess("");
            }}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === "profile"
                ? "bg-primary text-black"
                : "text-gray-400 hover:text-white hover:bg-gray-800"
            }`}
          >
            Profile
          </button>
          <button
            onClick={() => {
              setActiveTab("security");
              setError("");
              setSuccess("");
            }}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === "security"
                ? "bg-primary text-black"
                : "text-gray-400 hover:text-white hover:bg-gray-800"
            }`}
          >
            Security
          </button>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/50 border border-red-600 rounded-lg">
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-green-900/50 border border-green-600 rounded-lg">
            <p className="text-green-300 text-sm">{success}</p>
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === "profile" && (
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-6">Profile Information</h2>

            <form onSubmit={handleUpdateProfile} className="space-y-6">
              {/* Username */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Username
                  {currentUserInfo?.currentUsername && (
                    <span className="text-gray-500 ml-2">
                      (current: <span className="text-primary">{currentUserInfo.currentUsername}</span>)
                    </span>
                  )}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => handleUsernameChange(e.target.value)}
                    placeholder="Enter new username"
                    minLength={3}
                    maxLength={20}
                    className={`w-full px-4 py-3 bg-black border rounded-lg text-white placeholder-gray-500 focus:outline-none transition-colors pr-10 ${
                      usernameStatus === "available"
                        ? "border-green-500 focus:border-green-500"
                        : usernameStatus === "taken" || usernameStatus === "invalid"
                        ? "border-red-500 focus:border-red-500"
                        : "border-gray-700 focus:border-primary"
                    }`}
                  />
                  {/* Status indicator */}
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {usernameStatus === "checking" && (
                      <svg className="w-5 h-5 text-gray-400 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    )}
                    {usernameStatus === "available" && (
                      <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                    {(usernameStatus === "taken" || usernameStatus === "invalid") && (
                      <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                  </div>
                </div>
                <p className={`text-xs mt-1 ${
                  usernameStatus === "available" 
                    ? "text-green-400" 
                    : usernameStatus === "taken"
                    ? "text-red-400"
                    : usernameStatus === "invalid"
                    ? "text-red-400"
                    : "text-gray-500"
                }`}>
                  {usernameStatus === "available" 
                    ? "✓ Username is available"
                    : usernameStatus === "taken"
                    ? "✗ Username is already taken"
                    : usernameStatus === "invalid"
                    ? "3-20 characters, letters, numbers, and underscores only"
                    : "This is how other users will see you."}
                </p>
              </div>

              {/* Description/Bio */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Description
                  {currentUserInfo?.currentDescription && (
                    <span className="text-gray-500 ml-2">
                      (current: <span className="text-gray-300">&quot;{currentUserInfo.currentDescription}&quot;</span>)
                    </span>
                  )}
                </label>
                <div className="relative">
                  <textarea
                    value={description}
                    onChange={(e) => {
                      if (e.target.value.length <= DESCRIPTION_MAX_LENGTH) {
                        setDescription(e.target.value);
                      }
                    }}
                    placeholder="Tell us about yourself..."
                    rows={2}
                    maxLength={DESCRIPTION_MAX_LENGTH}
                    className={`w-full px-4 py-3 bg-black border rounded-lg text-white placeholder-gray-500 focus:outline-none transition-colors resize-none ${
                      description.length >= DESCRIPTION_MAX_LENGTH
                        ? "border-yellow-500 focus:border-yellow-500"
                        : "border-gray-700 focus:border-primary"
                    }`}
                  />
                </div>
                <div className="flex justify-between items-center mt-1">
                  <p className="text-xs text-gray-500">
                    A short bio about yourself (optional).
                  </p>
                  <p className={`text-xs ${
                    description.length >= DESCRIPTION_MAX_LENGTH
                      ? "text-yellow-400"
                      : description.length >= DESCRIPTION_MAX_LENGTH - 10
                      ? "text-gray-400"
                      : "text-gray-500"
                  }`}>
                    {description.length}/{DESCRIPTION_MAX_LENGTH}
                  </p>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-3 bg-primary text-black font-semibold rounded-lg hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Saving..." : "Save Changes"}
              </button>
            </form>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === "security" && (
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-6">Change Password</h2>

            <form onSubmit={handleChangePassword} className="space-y-6">
              {/* Current Password */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  required
                  className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              {/* New Password */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  required
                  minLength={8}
                  className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary transition-colors"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Must be at least 8 characters long.
                </p>
              </div>

              {/* Confirm New Password */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  required
                  className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-3 bg-primary text-black font-semibold rounded-lg hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Changing Password..." : "Change Password"}
              </button>
            </form>
          </div>
        )}

        {/* Danger Zone */}
        <div className="mt-8 bg-red-900/20 border border-red-900/50 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-red-400 mb-2">
            Danger Zone
          </h2>
          <p className="text-sm text-gray-400 mb-4">
            Once you delete your account, there is no going back. Please be
            certain.
          </p>
          <button
            onClick={() => {
              if (
                confirm(
                  "Are you sure you want to delete your account? This action cannot be undone."
                )
              ) {
                // In production: implement account deletion
                alert("Account deletion is not yet implemented.");
              }
            }}
            className="px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-colors text-sm font-medium"
          >
            Delete Account
          </button>
        </div>
      </main>
      </div>
    </AuthGuard>
  );
}
