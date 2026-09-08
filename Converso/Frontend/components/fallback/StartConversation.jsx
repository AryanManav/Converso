"use client";

import Link from "next/link";
import { HiOutlineChatBubbleLeftRight, HiOutlineMagnifyingGlass } from "react-icons/hi2";

export default function StartConversation() {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center p-8 text-center select-none bg-zinc-50/60 dark:bg-zinc-950">
      <div className="w-16 h-16 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-card flex items-center justify-center text-primary-600 dark:text-primary-400 mb-5">
        <HiOutlineChatBubbleLeftRight className="w-8 h-8" />
      </div>

      <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight mb-2">
        Select a conversation
      </h2>

      <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-sm mb-6 leading-relaxed">
        Choose a peer from the left sidebar to start chatting, or discover new peers to connect with.
      </p>

      <button
        type="button"
        onClick={() => {
          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("focus-chat-search"));
          }
        }}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-900 dark:bg-primary-600 hover:bg-zinc-800 dark:hover:bg-primary-700 text-white text-xs font-semibold shadow-xs hover:shadow transition-all active:scale-95"
      >
        <HiOutlineMagnifyingGlass className="w-4 h-4" />
        Find new peers
      </button>
    </div>
  );
}