"use client";

import Profilepic from "@/components/Profilepic";
import axios from "axios";
import { useEffect, useState } from "react";
import Link from "next/link";
import { apiUrl } from "@/lib/api";
import { HiOutlineArrowLeft, HiOutlineChatBubbleOvalLeftEllipsis } from "react-icons/hi2";

export default function PublicProfile({ params }) {
  const { username } = params;
  const [user, setUser] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!username) return;

    axios
      .get(apiUrl(`/api/profile?username=${username}`))
      .then((response) => {
        setUser(response.data || {});
      })
      .catch((error) => {
        console.error("Error fetching peer profile:", error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [username]);

  const displayName = [user.fname, user.lname].filter(Boolean).join(" ") || username || "Peer";

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      {/* Back button */}
      <div className="mb-6">
        <Link
          href="/chat"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-900 transition-colors"
        >
          <HiOutlineArrowLeft className="w-4 h-4" />
          Back to chats
        </Link>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl p-8 border border-zinc-200/80 shadow-subtle animate-pulse space-y-4">
          <div className="w-16 h-16 rounded-full bg-zinc-200 mx-auto" />
          <div className="h-5 bg-zinc-200 rounded w-32 mx-auto" />
          <div className="h-3 bg-zinc-100 rounded w-20 mx-auto" />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-subtle overflow-hidden">
          {/* Card Header */}
          <div className="p-8 text-center bg-gradient-to-b from-zinc-50 to-white border-b border-zinc-100 flex flex-col items-center">
            <Profilepic
              gender={user.gender}
              name={user.fname || username}
              className="w-20 h-20 shadow-md mb-3 ring-4 ring-white"
            />
            <h1 className="text-xl font-bold text-zinc-900 capitalize">
              {displayName}
            </h1>
            <span className="text-xs font-mono text-zinc-400 mt-0.5">
              @{username}
            </span>

            {user.bio && (
              <p className="text-xs sm:text-sm text-zinc-600 max-w-md mx-auto mt-4 leading-relaxed italic">
                "{user.bio}"
              </p>
            )}
          </div>

          {/* Details list */}
          <div className="p-6 divide-y divide-zinc-100 text-xs">
            {user.gender && (
              <div className="py-3 flex justify-between items-center">
                <span className="text-zinc-400 font-medium">Gender</span>
                <span className="text-zinc-700 font-semibold">{user.gender}</span>
              </div>
            )}
            {user.DOB && (
              <div className="py-3 flex justify-between items-center">
                <span className="text-zinc-400 font-medium">Date of Birth</span>
                <span className="text-zinc-700 font-semibold">{user.DOB}</span>
              </div>
            )}
            {user.regDate && (
              <div className="py-3 flex justify-between items-center">
                <span className="text-zinc-400 font-medium">Member Since</span>
                <span className="text-zinc-700 font-semibold">
                  {new Date(user.regDate).toLocaleDateString([], {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
            )}
          </div>

          {/* Quick Chat Action */}
          <div className="p-6 bg-zinc-50/50 border-t border-zinc-100 flex justify-center">
            <Link
              href="/chat"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold shadow-xs hover:shadow transition-all active:scale-95"
            >
              <HiOutlineChatBubbleOvalLeftEllipsis className="w-4 h-4" />
              Open in Chats
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

