"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import Profilepic from "@/components/Profilepic";
import DateOfBirthSelector from "@/components/utils/DateOfBirthSelector";
import axios from "axios";
import { apiUrl } from "@/lib/api";
import {
  HiArrowLeft,
  HiCheck,
  HiOutlineCamera,
  HiOutlineTrash,
  HiOutlinePencilSquare,
  HiOutlineUser,
  HiOutlineCalendar,
  HiXMark,
} from "react-icons/hi2";
import { ThreeDots } from "react-loader-spinner";
import { toast } from "react-toastify";

export default function MyProfileDrawer({ isOpen, onClose, username }) {
  const [user, setUser] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef(null);

  // Always resolve the definitive active username
  const getActiveUsername = useCallback(() => {
    if (username && typeof username === "string" && username.trim()) {
      return username.trim();
    }
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("username");
      if (stored && stored.trim()) return stored.trim();
    }
    return "";
  }, [username]);

  // Fetch latest profile when drawer opens
  const fetchProfile = useCallback(() => {
    const uname = getActiveUsername();
    if (!uname) {
      setLoading(false);
      return;
    }

    setLoading(true);
    axios
      .get(apiUrl(`/api/profile?username=${uname}`))
      .then((res) => {
        const data = res.data?.user || res.data || {};
        setUser({
          ...data,
          username: uname, // Guarantee username is always populated
        });
      })
      .catch((err) => {
        console.error("Error loading my profile:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [getActiveUsername]);

  useEffect(() => {
    if (isOpen) {
      setIsEditing(false); // Default to clean Read-Only View mode
      fetchProfile();
    }
  }, [isOpen, fetchProfile]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUser((prev) => ({ ...prev, [name]: value }));
  };

  // Direct profile picture update to database
  const persistProfilePic = (base64Pic) => {
    const activeUser = getActiveUsername();
    if (!activeUser) return;

    axios
      .post(apiUrl("/api/register/setprofile"), {
        username: activeUser,
        profilePic: base64Pic,
      })
      .then((res) => {
        if (!res.data?.error) {
          const updatedUser = res.data?.user || { ...user, profilePic: base64Pic };
          setUser((prev) => ({ ...prev, profilePic: base64Pic }));
          if (typeof window !== "undefined") {
            window.dispatchEvent(
              new CustomEvent("user-profile-updated", {
                detail: { user: updatedUser },
              })
            );
          }
        }
      })
      .catch((err) => {
        console.error("Error auto-syncing profile pic:", err);
      });
  };

  // Image Upload and Client-side Canvas Compression
  const handleImageFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload a valid image file (PNG, JPG, WEBP)");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size is too large (max 10MB)");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_SIZE = 360;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height = Math.round((height * MAX_SIZE) / width);
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width = Math.round((width * MAX_SIZE) / height);
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        // Compress to JPEG format with 0.82 quality (~25-50KB)
        const compressedBase64 = canvas.toDataURL("image/jpeg", 0.82);
        setUser((prev) => ({ ...prev, profilePic: compressedBase64 }));
        
        // Immediately persist to DB so search & chats instantly reflect it
        persistProfilePic(compressedBase64);
        toast.success("Profile photo updated successfully!");
      };
      img.src = event.target?.result;
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setUser((prev) => ({ ...prev, profilePic: "" }));
    if (fileInputRef.current) fileInputRef.current.value = "";
    persistProfilePic("");
    toast.info("Profile photo removed");
  };

  const handleSave = (e) => {
    e.preventDefault();
    const activeUser = getActiveUsername();
    if (!activeUser) {
      toast.error("User session missing. Please log in again.");
      return;
    }

    setSaving(true);

    axios
      .post(apiUrl("/api/register/setprofile"), {
        username: activeUser,
        fname: user.fname || "",
        lname: user.lname || "",
        gender: user.gender || "Other",
        bio: user.bio || "",
        dob: user.DOB || "",
        profilePic: user.profilePic || "",
      })
      .then((res) => {
        if (!res.data?.error) {
          toast.success("Profile updated successfully!");
          const updatedUser = res.data?.user || user;
          setUser({ ...updatedUser, username: activeUser });
          setIsEditing(false); // Return to read-only view mode
          if (typeof window !== "undefined") {
            window.dispatchEvent(
              new CustomEvent("user-profile-updated", {
                detail: { user: updatedUser },
              })
            );
          }
        } else {
          toast.error(res.data?.error || "Failed to update profile");
        }
      })
      .catch((err) => {
        console.error(err);
        toast.error("Network error saving profile");
      })
      .finally(() => {
        setSaving(false);
      });
  };

  if (!isOpen) return null;

  const currentUsername = getActiveUsername();
  const displayName = [user.fname, user.lname].filter(Boolean).join(" ") || currentUsername || "User";

  return (
    <div className="absolute inset-0 bg-white dark:bg-zinc-900 z-30 flex flex-col animate-fadeIn">
      {/* Drawer Header */}
      <div className="h-16 px-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/80 dark:bg-zinc-900/80 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-zinc-100 hover:bg-zinc-200/80 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 flex items-center justify-center transition-colors active:scale-95 shadow-xs"
            title="Back to Messages"
          >
            <HiArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
              {isEditing ? "Edit Profile" : "My Profile"}
            </h2>
            <p className="text-[11px] text-zinc-400">
              {isEditing ? "Update your personal details" : "Your profile details & avatar"}
            </p>
          </div>
        </div>

        {/* Header Action: Edit / Cancel Toggle */}
        {!loading && (
          <div>
            {isEditing ? (
              <button
                type="button"
                onClick={() => {
                  fetchProfile();
                  setIsEditing(false);
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <HiXMark className="w-4 h-4" />
                <span>Cancel</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary-50 dark:bg-primary-950/50 hover:bg-primary-100 dark:hover:bg-primary-900/60 text-primary-600 dark:text-primary-400 text-xs font-semibold transition-all active:scale-95 shadow-2xs"
                title="Edit details"
              >
                <HiOutlinePencilSquare className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Drawer Body */}
      <div className="flex-1 overflow-y-auto p-5">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3 animate-pulse">
            <div className="w-20 h-20 rounded-full bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-28" />
          </div>
        ) : !isEditing ? (
          /* ==================================================== */
          /* MODE 1: CLEAN READ-ONLY VIEW (Default)              */
          /* ==================================================== */
          <div className="space-y-6">
            {/* Avatar & Username Card */}
            <div className="flex flex-col items-center text-center pb-5 border-b border-zinc-100 dark:border-zinc-800">
              <div className="relative mb-3 group">
                <Profilepic
                  gender={user.gender}
                  name={user.fname || currentUsername}
                  profilePic={user.profilePic}
                  className="w-24 h-24 rounded-full shadow-md ring-4 ring-primary-50 dark:ring-primary-950/40"
                />

                {/* Instant Change Photo Camera Button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary-600 hover:bg-primary-700 text-white flex items-center justify-center ring-2 ring-white dark:ring-zinc-900 shadow-md transition-transform active:scale-95"
                  title="Change profile picture"
                >
                  <HiOutlineCamera className="w-4 h-4" />
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageFile}
                  className="hidden"
                />
              </div>

              {/* Photo Action Links */}
              <div className="flex items-center gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline"
                >
                  Change Photo
                </button>
                {user.profilePic && (
                  <>
                    <span className="text-zinc-300 dark:text-zinc-700">•</span>
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="text-xs font-medium text-rose-500 hover:text-rose-600 flex items-center gap-1 hover:underline"
                    >
                      <HiOutlineTrash className="w-3 h-3" />
                      Remove
                    </button>
                  </>
                )}
              </div>

              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 capitalize">
                {displayName}
              </h3>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 font-medium mt-0.5">
                @{currentUsername}
              </p>
            </div>

            {/* About / Bio Card */}
            <div className="bg-zinc-50 dark:bg-zinc-800/60 rounded-2xl p-4 border border-zinc-100 dark:border-zinc-800">
              <span className="block text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2">
                About / Bio
              </span>
              <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed italic">
                {user.bio ? `"${user.bio}"` : "No bio added yet."}
              </p>
            </div>

            {/* Details List */}
            <div className="space-y-2.5">
              <span className="block text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                Personal Information
              </span>

              {/* Gender */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-50/70 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 text-xs">
                <span className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
                  <HiOutlineUser className="w-4 h-4 text-zinc-400" />
                  Gender
                </span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                  {user.gender || "Not specified"}
                </span>
              </div>

              {/* Date of Birth */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-50/70 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 text-xs">
                <span className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
                  <HiOutlineCalendar className="w-4 h-4 text-zinc-400" />
                  Date of Birth
                </span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                  {user.DOB || "Not specified"}
                </span>
              </div>
            </div>

            {/* Edit Profile CTA Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="w-full py-2.5 px-4 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-xs"
              >
                <HiOutlinePencilSquare className="w-4 h-4" />
                <span>Edit Profile Details</span>
              </button>
            </div>
          </div>
        ) : (
          /* ==================================================== */
          /* MODE 2: EDIT PROFILE FORM (Only when demanded)       */
          /* ==================================================== */
          <form onSubmit={handleSave} className="space-y-5">
            {/* Avatar & Photo Upload */}
            <div className="flex flex-col items-center text-center pb-4 border-b border-zinc-100 dark:border-zinc-800">
              <div className="relative mb-3 group">
                <Profilepic
                  gender={user.gender}
                  name={user.fname || currentUsername}
                  profilePic={user.profilePic}
                  className="w-24 h-24 rounded-full shadow-md ring-4 ring-primary-50 dark:ring-primary-950/40"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary-600 hover:bg-primary-700 text-white flex items-center justify-center ring-2 ring-white dark:ring-zinc-900 shadow-md transition-transform active:scale-95"
                  title="Upload profile picture"
                >
                  <HiOutlineCamera className="w-4 h-4" />
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageFile}
                  className="hidden"
                />
              </div>

              <div className="flex items-center gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline"
                >
                  Change Photo
                </button>
                {user.profilePic && (
                  <>
                    <span className="text-zinc-300 dark:text-zinc-700">•</span>
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="text-xs font-medium text-rose-500 hover:text-rose-600 flex items-center gap-1 hover:underline"
                    >
                      <HiOutlineTrash className="w-3 h-3" />
                      Remove
                    </button>
                  </>
                )}
              </div>

              <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                @{currentUsername}
              </span>
            </div>

            {/* First & Last Name */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-300 uppercase tracking-wider mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  name="fname"
                  value={user.fname || ""}
                  onChange={handleChange}
                  placeholder="First name"
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:bg-white dark:focus:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-300 uppercase tracking-wider mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  name="lname"
                  value={user.lname || ""}
                  onChange={handleChange}
                  placeholder="Last name"
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:bg-white dark:focus:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                />
              </div>
            </div>

            {/* Bio */}
            <div>
              <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-300 uppercase tracking-wider mb-1">
                About / Bio
              </label>
              <textarea
                name="bio"
                rows={3}
                value={user.bio || ""}
                onChange={handleChange}
                placeholder="Write a short bio about yourself..."
                className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-3 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:bg-white dark:focus:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all resize-none"
              />
            </div>

            {/* Gender Selection */}
            <div>
              <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                Gender
              </label>
              <div className="grid grid-cols-3 gap-2">
                {["Male", "Female", "Other"].map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setUser((prev) => ({ ...prev, gender: g }))}
                    className={`py-2 px-3 text-xs rounded-xl font-medium border transition-all ${
                      user.gender === g
                        ? "border-primary-500 bg-primary-50 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300 font-bold shadow-xs ring-1 ring-primary-500/30"
                        : "border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            {/* Date of Birth Selector */}
            <div>
              <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                Date of Birth
              </label>
              <DateOfBirthSelector
                value={user.DOB || ""}
                onChange={(dob) => setUser((prev) => ({ ...prev, DOB: dob }))}
                label=""
              />
            </div>

            {/* Buttons: Save & Cancel */}
            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  fetchProfile();
                  setIsEditing(false);
                }}
                disabled={saving}
                className="flex-1 py-2.5 px-4 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-semibold transition-all active:scale-95 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="flex-[2] py-2.5 px-4 rounded-xl bg-zinc-900 dark:bg-primary-600 hover:bg-zinc-800 dark:hover:bg-primary-700 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 shadow-xs"
              >
                {saving ? (
                  <ThreeDots height={16} width={32} color="#ffffff" visible={true} />
                ) : (
                  <>
                    <HiCheck className="w-4 h-4" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
