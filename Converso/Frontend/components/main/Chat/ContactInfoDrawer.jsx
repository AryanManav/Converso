"use client";

import React, { useState } from "react";
import Profilepic from "@/components/Profilepic";
import { HiXMark, HiOutlineDocumentDuplicate, HiOutlineCalendar, HiOutlineUser, HiCheck } from "react-icons/hi2";
import { toast } from "react-toastify";

export default function ContactInfoDrawer({ isOpen, onClose, user, isOnline, lastSeenText }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const displayName = [user?.fname, user?.lname].filter(Boolean).join(" ") || user?.username || "Peer";

  const copyUsername = () => {
    if (!user?.username) return;
    navigator.clipboard.writeText(user.username);
    setCopied(true);
    toast.success(`Copied @${user.username} to clipboard!`);
    setTimeout(() => setCopied(false), 2000);
  };

  const memberSince = user?.regDate
    ? new Date(user.regDate).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    : "PeerTalks Member";

  return (
    <>
      {/* Backdrop for mobile/tablet */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-zinc-900/20 backdrop-blur-xs z-30 lg:hidden transition-opacity"
      />

      {/* Slide-over Drawer Panel */}
      <aside
        className="fixed top-0 right-0 h-screen w-80 sm:w-96 bg-white dark:bg-zinc-900 border-l border-zinc-200/80 dark:border-zinc-800 shadow-2xl flex flex-col z-40 animate-fadeIn"
        style={{
          animationDuration: "0.25s",
        }}
      >
        {/* Drawer Header */}
        <div className="h-16 px-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/70 dark:bg-zinc-900/80">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-zinc-100 hover:bg-zinc-200/80 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-200 flex items-center justify-center transition-colors shadow-xs active:scale-95"
              title="Close contact info"
            >
              <HiXMark className="w-4 h-4" />
            </button>
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
              Contact info
            </h2>
          </div>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Avatar & Display Name */}
          <div className="flex flex-col items-center text-center pb-6 border-b border-zinc-100 dark:border-zinc-800">
            <div className="relative mb-4">
              <Profilepic
                gender={user?.gender}
                name={user?.fname || user?.username}
                profilePic={user?.profilePic}
                className="w-24 h-24 rounded-full shadow-md ring-4 ring-primary-50 dark:ring-primary-950/40"
              />
              <span
                className={`absolute bottom-1 right-1 w-4 h-4 rounded-full ring-2 ring-white dark:ring-zinc-900 ${
                  isOnline ? "bg-emerald-500" : "bg-zinc-300 dark:bg-zinc-600"
                }`}
                title={isOnline ? "Online" : "Offline"}
              />
            </div>

            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 capitalize">
              {displayName}
            </h3>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
              @{user?.username}
            </p>

            {/* Status Pill */}
            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-zinc-100/80 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
              <span
                className={`w-2 h-2 rounded-full ${
                  isOnline ? "bg-emerald-500 animate-pulse" : "bg-zinc-400 dark:bg-zinc-500"
                }`}
              />
              <span>{isOnline ? "Active now" : lastSeenText || "Offline"}</span>
            </div>
          </div>

          {/* About / Bio */}
          <div className="bg-zinc-100/70 dark:bg-zinc-800/80 rounded-2xl p-4 border border-zinc-200/80 dark:border-zinc-700/80 shadow-2xs">
            <span className="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
              About
            </span>
            <p className="text-xs text-zinc-800 dark:text-zinc-100 leading-relaxed font-medium">
              {user?.bio ? `"${user.bio}"` : "No bio provided yet."}
            </p>
          </div>

          {/* Peer Details */}
          <div className="space-y-3">
            <span className="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Profile Details
            </span>

            {/* Gender */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-100/70 dark:bg-zinc-800/80 border border-zinc-200/80 dark:border-zinc-700/80 text-xs">
              <span className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
                <HiOutlineUser className="w-4 h-4 text-zinc-400" />
                Gender
              </span>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                {user?.gender || "Not specified"}
              </span>
            </div>

            {/* Member Since */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-100/70 dark:bg-zinc-800/80 border border-zinc-200/80 dark:border-zinc-700/80 text-xs">
              <span className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
                <HiOutlineCalendar className="w-4 h-4 text-zinc-400" />
                Joined PeerTalks
              </span>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                {memberSince}
              </span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="pt-2">
            <button
              onClick={copyUsername}
              className="w-full py-3 px-4 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-100 text-xs font-semibold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-xs"
            >
              {copied ? (
                <>
                  <HiCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-emerald-600 dark:text-emerald-400">Copied to clipboard!</span>
                </>
              ) : (
                <>
                  <HiOutlineDocumentDuplicate className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                  <span>Copy Username (@{user?.username})</span>
                </>
              )}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
