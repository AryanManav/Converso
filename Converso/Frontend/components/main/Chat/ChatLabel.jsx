"use client";

import Profilepic from "@/components/Profilepic";
import Link from "next/link";

const formatMessageTime = (time) => {
  if (!time) return "";
  const d = new Date(time);
  if (isNaN(d.getTime())) return "";
  const now = new Date();
  const diffMs = now - d;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return d.toLocaleDateString([], { weekday: "short" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
};

export default function ChatLabel({ user, active }) {
  const displayName =
    [user.fname, user.lname].filter(Boolean).join(" ") ||
    user.username ||
    "Peer";

  return (
    <Link
      href={`/chat/${user.chat_id}`}
      className={`mx-2 my-1 flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all duration-150 cursor-pointer ${
        active
          ? "bg-primary-50/90 dark:bg-primary-950/60 text-zinc-900 dark:text-zinc-100 shadow-xs ring-1 ring-primary-500/20 dark:ring-primary-500/30"
          : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100/80 dark:hover:bg-zinc-800/60"
      }`}
    >
      <div className="relative shrink-0">
        <Profilepic
          className="w-10 h-10 shadow-xs ring-1 ring-zinc-200/60 dark:ring-zinc-700/60"
          gender={user.gender}
          name={user.fname || user.username}
          profilePic={user.profilePic}
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-1">
          <span
            className={`text-sm font-semibold truncate capitalize ${
              active
                ? "text-primary-700 dark:text-primary-300 font-bold"
                : "text-zinc-900 dark:text-zinc-100"
            }`}
          >
            {displayName}
          </span>
          {user.lastMessageTime && (
            <span className="text-[10px] text-zinc-400 dark:text-zinc-500 shrink-0 font-normal">
              {formatMessageTime(user.lastMessageTime)}
            </span>
          )}
        </div>
        <div className="flex items-center text-xs text-zinc-400 dark:text-zinc-500 truncate mt-0.5">
          <span className="truncate text-xs text-zinc-500 dark:text-zinc-400">
            {user.lastMessage || `@${user.username}`}
          </span>
        </div>
      </div>
    </Link>
  );
}