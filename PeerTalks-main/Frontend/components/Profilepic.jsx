"use client";

import { useState } from "react";

export default function Profilepic({
  gender,
  className = "",
  name = "",
  username = "",
  image = "",
  profilePic = "",
  avatar = "",
}) {
  const [imgError, setImgError] = useState(false);
  const avatarSrc = image || profilePic || avatar;

  const isFemale = gender === "Female";
  const displayName = name || username || "";
  const initial = displayName ? displayName.charAt(0).toUpperCase() : "";

  if (avatarSrc && !imgError) {
    return (
      <div
        className={`inline-flex items-center justify-center rounded-full overflow-hidden select-none shrink-0 bg-zinc-100 ${className}`}
      >
        <img
          src={avatarSrc}
          alt={displayName || "Profile picture"}
          className="w-full h-full object-cover rounded-full"
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center justify-center rounded-full overflow-hidden select-none shrink-0 font-medium ${
        isFemale
          ? "bg-gradient-to-tr from-rose-400 to-amber-300 text-white"
          : "bg-gradient-to-tr from-indigo-500 to-sky-400 text-white"
      } ${className}`}
    >
      {initial ? (
        <span className="text-sm font-semibold tracking-wider">{initial}</span>
      ) : (
        <svg
          className="w-3/5 h-3/5 text-white/90"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
        </svg>
      )}
    </div>
  );
}