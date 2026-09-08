"use client";

import Profilepic from "@/components/Profilepic";
import Link from "next/link";

export default function ChatLabel({ user, active }) {
  const displayName = [user.fname, user.lname].filter(Boolean).join(" ") || user.username || "Peer";

  return (
    <Link
      href={`/chat/${user.chat_id}`}
      className={`mx-2 my-1 flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 cursor-pointer ${
        active
          ? "bg-primary-50 dark:bg-primary-950/50 text-zinc-900 dark:text-zinc-100 font-semibold shadow-xs ring-1 ring-primary-200/60 dark:ring-primary-800/60"
          : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100/80 dark:hover:bg-zinc-800/70"
      }`}
    >
      <div className="relative shrink-0">
        <Profilepic
          className="w-10 h-10 shadow-xs"
          gender={user.gender}
          name={user.fname || user.username}
          profilePic={user.profilePic}
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium truncate capitalize">
            {displayName}
          </span>
        </div>
        <div className="flex items-center text-xs text-zinc-400 dark:text-zinc-500 truncate mt-0.5">
          <span>@{user.username}</span>
        </div>
      </div>
    </Link>
  );
}