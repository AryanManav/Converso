"use client";

import {
  HiOutlineChatBubbleLeftRight,
  HiOutlineMagnifyingGlass,
  HiOutlineSparkles,
  HiOutlineShieldCheck,
  HiOutlineBolt,
} from "react-icons/hi2";

export default function StartConversation() {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center p-8 text-center select-none bg-zinc-50/70 dark:bg-zinc-950 bg-[radial-gradient(#e4e4e7_1px,transparent_1px)] dark:bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:20px_20px] relative overflow-hidden">
      {/* Ambient gradient glow in background */}
      <div className="absolute w-96 h-96 rounded-full bg-primary-500/10 dark:bg-primary-500/5 blur-3xl pointer-events-none -top-12 -right-12" />
      <div className="absolute w-96 h-96 rounded-full bg-indigo-500/10 dark:bg-indigo-500/5 blur-3xl pointer-events-none -bottom-12 -left-12" />

      {/* Main card */}
      <div className="relative z-10 max-w-md w-full flex flex-col items-center">
        {/* Animated Icon Emblem */}
        <div className="relative mb-6">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-primary-600 to-indigo-600 text-white shadow-xl shadow-primary-500/25 flex items-center justify-center animate-fadeIn">
            <HiOutlineChatBubbleLeftRight className="w-10 h-10" />
          </div>
          <span className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-white dark:bg-zinc-900 shadow-md">
            <HiOutlineSparkles className="w-4 h-4 text-amber-500 animate-spin" style={{ animationDuration: "8s" }} />
          </span>
        </div>

        <h2 className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight mb-2">
          Your Conversations
        </h2>

        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-sm mb-7 leading-relaxed">
          Select a chat from the sidebar to continue your conversation, or discover new peers to connect with.
        </p>

        {/* Feature Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-8 max-w-xs sm:max-w-md">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/80 dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800 text-[11px] font-medium text-zinc-600 dark:text-zinc-300 shadow-2xs backdrop-blur-xs">
            <HiOutlineBolt className="w-3.5 h-3.5 text-amber-500" />
            Instant Messaging
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/80 dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800 text-[11px] font-medium text-zinc-600 dark:text-zinc-300 shadow-2xs backdrop-blur-xs">
            <HiOutlineShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            End-to-End Encrypted
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/80 dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800 text-[11px] font-medium text-zinc-600 dark:text-zinc-300 shadow-2xs backdrop-blur-xs">
            <HiOutlineSparkles className="w-3.5 h-3.5 text-primary-500" />
            Rich Emojis & Reactions
          </span>
        </div>

        {/* Find Peers CTA */}
        <button
          type="button"
          onClick={() => {
            if (typeof window !== "undefined") {
              window.dispatchEvent(new CustomEvent("focus-chat-search"));
            }
          }}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-zinc-900 hover:bg-zinc-800 dark:bg-primary-600 dark:hover:bg-primary-700 text-white text-xs font-bold shadow-lg shadow-zinc-900/10 dark:shadow-primary-600/20 hover:shadow-xl transition-all active:scale-95"
        >
          <HiOutlineMagnifyingGlass className="w-4 h-4" />
          Find new peers
        </button>
      </div>
    </div>
  );
}
