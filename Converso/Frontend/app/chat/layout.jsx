"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import ChatList from "@/components/main/Chat/ChatList";
import axios from "axios";
import { apiUrl } from "@/lib/api";
import {
  HiOutlineSun,
  HiOutlineMoon,
  HiOutlineQuestionMarkCircle,
  HiArrowLeftOnRectangle,
} from "react-icons/hi2";
import Profilepic from "@/components/Profilepic";
import { ThreeDots } from "react-loader-spinner";
import MyProfileDrawer from "@/components/main/Chat/MyProfileDrawer";
import HelpDrawer from "@/components/main/Chat/HelpDrawer";
// import CallModal from "@/components/main/Call/CallModal";

export default function ChatLayout({ children }) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [currentUser, setCurrentUser] = useState("");
  const [myProfile, setMyProfile] = useState({});
  const [isProfileDrawerOpen, setIsProfileDrawerOpen] = useState(false);
  const [isHelpDrawerOpen, setIsHelpDrawerOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);

  // Initialize Dark Mode
  useEffect(() => {
    const savedTheme = localStorage.getItem("peertalks_theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
      setIsDark(true);
      document.documentElement.classList.add("dark");
    } else {
      setIsDark(false);
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleTheme = () => {
    setIsDark((prev) => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add("dark");
        localStorage.setItem("peertalks_theme", "dark");
      } else {
        document.documentElement.classList.remove("dark");
        localStorage.setItem("peertalks_theme", "light");
      }
      return next;
    });
  };

  // Fetch my profile info for header avatar & status
  const fetchMyProfile = useCallback((uname) => {
    if (!uname) return;
    axios
      .get(apiUrl(`/api/profile?username=${uname}`))
      .then((res) => {
        setMyProfile(res.data?.user || {});
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handleOpenProfileDrawer = () => setIsProfileDrawerOpen(true);
    const handleOpenHelpDrawer = () => setIsHelpDrawerOpen(true);
    const handleProfileUpdated = (e) => {
      if (e?.detail?.user) setMyProfile(e.detail.user);
      else if (currentUser) fetchMyProfile(currentUser);
    };

    window.addEventListener("open-my-profile-drawer", handleOpenProfileDrawer);
    window.addEventListener("open-help-drawer", handleOpenHelpDrawer);
    window.addEventListener("user-profile-updated", handleProfileUpdated);

    return () => {
      window.removeEventListener("open-my-profile-drawer", handleOpenProfileDrawer);
      window.removeEventListener("open-help-drawer", handleOpenHelpDrawer);
      window.removeEventListener("user-profile-updated", handleProfileUpdated);
    };
  }, [currentUser, fetchMyProfile]);

  useEffect(() => {
    const username = localStorage.getItem("username");
    const password = localStorage.getItem("password");

    if (!username || !password) {
      router.replace("/login");
      return;
    }

    setCurrentUser(username);
    setAuthorized(true);
    fetchMyProfile(username);
  }, [router, fetchMyProfile]);

  const logout = () => {
    localStorage.removeItem("username");
    localStorage.removeItem("password");
    router.replace("/login");
  };

  if (!authorized) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-primary-600 to-primary-500 text-white flex items-center justify-center font-bold text-lg shadow-md shadow-primary-500/20 animate-pulse">
            P
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Verifying access...</p>
          <ThreeDots height={18} width={36} color="#4f46e5" visible={true} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-50 dark:bg-zinc-950">
      {/* Left Sidebar: Conversations list */}
      <aside className="w-80 sm:w-88 lg:w-96 flex-shrink-0 h-full border-r border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col z-10 shadow-[1px_0_2px_rgba(0,0,0,0.02)] relative overflow-hidden">
        {/* Sidebar Header with User Avatar & Action Buttons */}
        <div className="p-3.5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setIsProfileDrawerOpen(true)}
              className="relative group shrink-0 focus:outline-none"
              title={`Logged in as @${currentUser} (Click to edit profile)`}
            >
              <Profilepic
                username={currentUser}
                name={myProfile.fname || currentUser}
                gender={myProfile.gender}
                profilePic={myProfile.profilePic}
                className="w-10 h-10 rounded-full ring-2 ring-zinc-200 dark:ring-zinc-700 group-hover:ring-primary-500 transition-all shadow-xs"
              />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-zinc-900" />
            </button>
            <div
              className="min-w-0 cursor-pointer group"
              onClick={() => setIsProfileDrawerOpen(true)}
              title="Click to view & edit your profile"
            >
              <h1 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors tracking-tight leading-tight truncate">
                Messages
              </h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate flex items-center gap-1.5 mt-0.5">
                <span className="font-medium text-zinc-700 dark:text-zinc-300 truncate">@{currentUser}</span>
                <span className="text-zinc-300 dark:text-zinc-600">•</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Online
                </span>
              </p>
            </div>
          </div>

          {/* Quick Header Actions: Dark Mode Toggle, Help & Sign Out */}
          <div className="flex items-center gap-1.5 shrink-0 ml-2">
            {/* Dark Mode Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="w-8 h-8 rounded-xl bg-zinc-100 hover:bg-zinc-200/70 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 flex items-center justify-center transition-colors shadow-2xs active:scale-95"
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDark ? (
                <HiOutlineSun className="w-4 h-4 text-amber-400" />
              ) : (
                <HiOutlineMoon className="w-4 h-4 text-zinc-600" />
              )}
            </button>

            {/* Help & FAQ */}
            <button
              type="button"
              onClick={() => setIsHelpDrawerOpen(true)}
              className="w-8 h-8 rounded-xl bg-zinc-100 hover:bg-zinc-200/70 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 flex items-center justify-center transition-colors shadow-2xs active:scale-95"
              title="Help & FAQ"
            >
              <HiOutlineQuestionMarkCircle className="w-4 h-4" />
            </button>

            {/* Sign Out */}
            <button
              type="button"
              onClick={logout}
              className="w-8 h-8 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/30 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 flex items-center justify-center transition-colors shadow-2xs active:scale-95"
              title="Sign out"
            >
              <HiArrowLeftOnRectangle className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto">
          <ChatList />
        </div>

        {/* Slide-over My Profile Drawer */}
        <MyProfileDrawer
          isOpen={isProfileDrawerOpen}
          onClose={() => setIsProfileDrawerOpen(false)}
          username={currentUser}
        />

        {/* Slide-over Help Drawer */}
        <HelpDrawer
          isOpen={isHelpDrawerOpen}
          onClose={() => setIsHelpDrawerOpen(false)}
        />
      </aside>

      {/* Right Area: Conversation / Active Chatbox */}
      <section className="flex-1 flex flex-col h-full bg-zinc-50/70 dark:bg-zinc-950 overflow-hidden relative">
        {children}
      </section>

      {/* Global 1-on-1 Audio & Video Call Modal (temporarily commented out) */}
      {/* <CallModal /> */}
    </div>
  );
}
