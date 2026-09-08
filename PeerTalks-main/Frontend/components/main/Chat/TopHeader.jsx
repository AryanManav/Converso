"use client"
import Profilepic from "@/components/Profilepic";
import Link from "next/link";
import axios from "axios";
import { useEffect, useState, useCallback } from "react";
import { io } from "socket.io-client";
import { HiOutlineUserCircle } from "react-icons/hi2";
import { apiUrl } from "@/lib/api";
import ContactInfoDrawer from "./ContactInfoDrawer";

export default function TopHeader({ chatid }) {
  const [user, setUser] = useState({});
  const [isOnline, setIsOnline] = useState(false);
  const [lastSeen, setLastSeen] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Format last seen time
  const formatLastSeen = (lastSeenDate) => {
    if (!lastSeenDate) return "Offline";
    
    const now = new Date();
    const lastSeen = new Date(lastSeenDate);
    const diffMs = now - lastSeen;
    const diffMins = Math.floor(diffMs / 60000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    // Today
    if (diffDays === 0) {
      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      return `Today at ${lastSeen.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
    }
    
    // Yesterday
    if (diffDays === 1) {
      return `Yesterday at ${lastSeen.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
    }
    
    // Within a week
    if (diffDays < 7) {
      return `${diffDays}d ago`;
    }
    
    // More than a week
    return `${lastSeen.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  };

  // Fetch user status
  const fetchUserStatus = useCallback(async (username) => {
    try {
      const response = await fetch(apiUrl(`/api/user-status/${username}`));
      const data = await response.json();
      setIsOnline(Boolean(data.isOnline));
      setLastSeen(data.lastSeen);
    } catch (error) {
      console.error("Error fetching user status:", error);
    }
  }, []);

  // Fetch chat user info
  useEffect(() => {
    const username = localStorage.getItem("username");
    if (!username) return;

    axios
      .get(apiUrl(`/api/chat/chatuser?username=${username}&chatid=${chatid}`))
      .then((response) => {
        const userData = response.data;
        setUser(userData || {});
        
        if (userData?.username) {
          fetchUserStatus(userData.username);
        }
      })
      .catch((error) => {
        console.error("Error loading chat user:", error);
      });
  }, [chatid, fetchUserStatus]);

  // Setup Socket.IO for status synchronization
  useEffect(() => {
    if (!user?.username) return;

    const BACKEND_URL = process.env.NEXT_PUBLIC_SOCKET_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
    const socket = io(BACKEND_URL, {
      transports: ['websocket', 'polling']
    });

    socket.on("connect", () => {
      const currentUser = localStorage.getItem("username");
      if (currentUser) {
        socket.emit("join-chat", { chatId: chatid, username: currentUser });
      }
    });

    socket.on("user-status-changed", (data) => {
      const { username: statusUsername, isOnline: userIsOnline } = data;
      if (user?.username && statusUsername === user.username) {
        setIsOnline(userIsOnline);
        if (!userIsOnline) {
          fetchUserStatus(statusUsername);
        }
      }
    });

    return () => {
      socket.off("user-status-changed");
      socket.disconnect();
    };
  }, [chatid, user, fetchUserStatus]);

  const displayName = [user.fname, user.lname].filter(Boolean).join(" ") || user.username || "Peer";

  return (
    <>
      <div className="h-16 px-6 border-b border-zinc-200/80 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md flex items-center justify-between shrink-0 select-none z-10 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
        {/* Clickable User Info Header */}
        <button
          type="button"
          onClick={() => setIsDrawerOpen(true)}
          className="flex items-center gap-3 text-left group hover:opacity-90 transition-opacity focus:outline-none"
          title="Click to view contact info"
        >
          {/* Avatar with Status Pip */}
          <div className="relative">
            <Profilepic
              gender={user.gender}
              name={user.fname || user.username}
              profilePic={user.profilePic}
              className="w-10 h-10 shadow-xs group-hover:ring-2 ring-primary-500/40 rounded-full transition-all"
            />
            <span
              className={`absolute bottom-0 right-0 w-3 h-3 rounded-full ring-2 ring-white dark:ring-zinc-900 ${
                isOnline
                  ? "bg-emerald-500 animate-pulseSubtle"
                  : "bg-zinc-300 dark:bg-zinc-600"
              }`}
              title={isOnline ? "Online" : "Offline"}
            />
          </div>

          {/* User Info */}
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 capitalize group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                {displayName}
              </h2>
              {user.username && (
                <span className="text-xs text-zinc-400 dark:text-zinc-500 font-normal">
                  @{user.username}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <span
                className={`font-medium ${
                  isOnline ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-400 dark:text-zinc-500"
                }`}
              >
                {isOnline ? "Active now" : `Last seen ${formatLastSeen(lastSeen)}`}
              </span>
            </div>
          </div>
        </button>

        {/* Action button */}
        {user.username && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsDrawerOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors shadow-xs active:scale-95"
              title="View Contact Info"
            >
              <HiOutlineUserCircle className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
              Contact info
            </button>
          </div>
        )}
      </div>

      {/* Slide-over Contact Info Drawer */}
      <ContactInfoDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        user={user}
        isOnline={isOnline}
        lastSeenText={formatLastSeen(lastSeen)}
      />
    </>
  );
}

