"use client";

import React from "react";
import {
  HiArrowLeft,
  HiOutlineQuestionMarkCircle,
  HiOutlineMagnifyingGlass,
  HiOutlineChatBubbleLeftRight,
  HiOutlineUser,
  HiArrowLeftOnRectangle,
  HiOutlineShieldCheck,
} from "react-icons/hi2";

export default function HelpDrawer({ isOpen, onClose }) {
  if (!isOpen) return null;

  const faqs = [
    {
      icon: <HiOutlineMagnifyingGlass className="w-5 h-5 text-primary-600" />,
      title: "Finding & connecting with peers",
      desc: "Use the search bar at the top of the sidebar. Type any username to find users and click 'Connect' to send a friend request.",
    },
    {
      icon: <HiOutlineChatBubbleLeftRight className="w-5 h-5 text-emerald-600" />,
      title: "Real-time messaging",
      desc: "PeerTalks uses Socket.IO. Messages, live online status, and typing indicators update instantaneously without page reloads.",
    },
    {
      icon: <HiOutlineUser className="w-5 h-5 text-indigo-600" />,
      title: "Editing your profile",
      desc: "Click on your avatar in the sidebar header to open your profile drawer. Update your name, bio, gender, and date of birth anytime.",
    },
    {
      icon: <HiOutlineShieldCheck className="w-5 h-5 text-amber-600" />,
      title: "Friend requests & privacy",
      desc: "Switch to the 'Requests' tab in the sidebar to review and accept incoming requests. Only connected peers can start conversations.",
    },
    {
      icon: <HiArrowLeftOnRectangle className="w-5 h-5 text-rose-600" />,
      title: "Signing out",
      desc: "Click the logout icon in the sidebar header to safely end your session and mark your status as offline for peers.",
    },
  ];

  return (
    <div className="absolute inset-0 bg-white dark:bg-zinc-900 z-30 flex flex-col animate-fadeIn">
      {/* Header */}
      <div className="h-16 px-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-3 bg-zinc-50/80 dark:bg-zinc-900/80 shrink-0">
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-xl bg-zinc-100 hover:bg-zinc-200/80 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-zinc-700 dark:text-zinc-200 flex items-center justify-center transition-colors active:scale-95 shadow-xs"
          title="Back to Messages"
        >
          <HiArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary-100/70 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 flex items-center justify-center">
            <HiOutlineQuestionMarkCircle className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 tracking-tight leading-tight">
              Help & FAQ
            </h2>
            <p className="text-[11px] text-zinc-400">Quick guides & support</p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <div className="bg-primary-50/60 dark:bg-primary-950/40 border border-primary-100/80 dark:border-primary-900/50 rounded-2xl p-4 text-xs text-primary-950 dark:text-primary-200">
          <p className="font-semibold text-primary-900 dark:text-primary-100">Welcome to PeerTalks!</p>
          <p className="text-primary-700/90 dark:text-primary-300 mt-1 leading-relaxed">
            Everything is accessible right inside this chat window — search peers, manage friend requests, and edit your profile without navigating away.
          </p>
        </div>

        <span className="block text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider px-1 pt-2">
          Common Questions
        </span>

        {faqs.map((faq, idx) => (
          <div
            key={idx}
            className="p-3.5 rounded-2xl bg-zinc-50/70 dark:bg-zinc-850 border border-zinc-100 dark:border-zinc-800 hover:border-zinc-200/80 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all space-y-1.5"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200/60 dark:border-zinc-700 shadow-xs flex items-center justify-center shrink-0">
                {faq.icon}
              </div>
              <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 leading-snug">
                {faq.title}
              </h3>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 pl-10.5 leading-relaxed">
              {faq.desc}
            </p>
          </div>
        ))}

        <div className="p-4 rounded-2xl border border-zinc-200/60 dark:border-zinc-800 bg-white dark:bg-zinc-850 text-center space-y-2 mt-4">
          <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
            Need more assistance?
          </p>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
            PeerTalks 2.0 • Built with Next.js & Socket.IO
          </p>
        </div>
      </div>
    </div>
  );
}
