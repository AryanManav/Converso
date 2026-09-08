"use client"
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import axios from "axios";
import { MdNotificationsNone } from "react-icons/md";
import { BiHelpCircle } from "react-icons/bi";
import { TbMessage2 } from "react-icons/tb";
import { AiOutlineUsergroupAdd } from "react-icons/ai";
import { HiArrowLeftOnRectangle } from "react-icons/hi2";
import Profilepic from "./Profilepic";
import { apiUrl } from "@/lib/api";
import socket from "@/lib/socket";
import { toast } from "react-toastify";

const links = [
  {
    name: "Chats",
    icon: <TbMessage2 className="w-5 h-5" />,
    link: "/chat"
  },
  {
    name: "Friend Requests",
    icon: <AiOutlineUsergroupAdd className="w-5 h-5" />,
    link: "/friendrequest"
  },
  {
    name: "Notifications",
    icon: <MdNotificationsNone className="w-5 h-5" />,
    link: "/notification"
  },
  {
    name: "Help",
    icon: <BiHelpCircle className="w-5 h-5" />,
    link: "/help"
  }
];

const excludedPaths = ["/", "/register", "/login", "/register/setprofile"];

export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [friendRequestCount, setFriendRequestCount] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const user = localStorage.getItem("username") || "";
    setUsername(user);
    if (!user) return;

    // Fetch initial count
    const fetchCount = () => {
      axios
        .get(apiUrl(`/api/friendrequest/count?username=${user}`))
        .then((res) => {
          if (typeof res.data?.count === "number") {
            setFriendRequestCount(res.data.count);
          }
        })
        .catch(() => {});
    };

    fetchCount();

    // Sockets setup
    if (!socket.connected) {
      socket.connect();
    }
    socket.emit("register-user", user);

    const handleNewRequest = (data) => {
      if (typeof data?.count === "number") {
        setFriendRequestCount(data.count);
      } else {
        setFriendRequestCount((prev) => prev + 1);
      }
      toast.info(`New friend request from @${data?.sender || "someone"}!`, {
        icon: "👋",
      });
    };

    const handleCountUpdate = (data) => {
      if (typeof data?.count === "number") {
        setFriendRequestCount(data.count);
      }
    };

    const handleLocalCount = (e) => {
      if (typeof e?.detail?.count === "number") {
        setFriendRequestCount(e.detail.count);
      }
    };

    socket.on("new-friend-request", handleNewRequest);
    socket.on("friend-request-count-updated", handleCountUpdate);
    window.addEventListener("friend-request-count-changed", handleLocalCount);

    // Light fallback polling every 15 seconds
    const interval = setInterval(fetchCount, 15000);

    return () => {
      socket.off("new-friend-request", handleNewRequest);
      socket.off("friend-request-count-updated", handleCountUpdate);
      window.removeEventListener("friend-request-count-changed", handleLocalCount);
      clearInterval(interval);
    };
  }, [pathname]);

  const logout = () => {
    localStorage.removeItem("username");
    localStorage.removeItem("password");
  };

  if (excludedPaths.includes(pathname)) {
    return null;
  }

  const isProfileActive = pathname.startsWith("/profile");

  return (
    <aside className="fixed top-0 left-0 h-screen w-16 bg-white border-r border-zinc-200/80 flex flex-col justify-between items-center py-4 z-40 select-none shadow-[1px_0_4px_rgba(0,0,0,0.02)]">
      {/* Brand Icon */}
      <div className="flex flex-col items-center">
        <Link
          href="/chat"
          className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary-600 to-primary-500 text-white flex items-center justify-center shadow-md shadow-primary-500/20 hover:scale-105 transition-transform"
          title="Converso"
        >
          <span className="font-bold text-lg tracking-tight">C</span>
        </Link>
      </div>

      {/* Main Navigation Items */}
      <nav className="flex flex-col items-center gap-y-2">
        {links.map((elem) => {
          const active = pathname.startsWith(elem.link);
          const isFriendRequests = elem.link === "/friendrequest";
          const hasBadge = isFriendRequests && friendRequestCount > 0;

          return (
            <Link
              href={elem.link}
              key={elem.name}
              title={hasBadge ? `${elem.name} (${friendRequestCount} pending)` : elem.name}
              className={`relative group w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-150 ${
                active
                  ? "bg-primary-50 text-primary-600 font-semibold shadow-xs"
                  : "text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100/80"
              }`}
            >
              {elem.icon}

              {/* Red notification badge indicating pending friend requests */}
              {hasBadge && (
                <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-black text-white bg-rose-500 rounded-full border-2 border-white shadow-xs animate-scaleIn">
                  {friendRequestCount > 99 ? "99+" : friendRequestCount}
                </span>
              )}

              {/* Active Indicator Pip */}
              {active && (
                <span className="absolute -left-3 w-1 h-5 bg-primary-600 rounded-r-full" />
              )}

              {/* Tooltip */}
              <span className="absolute left-14 px-2 py-1 bg-zinc-900 text-white text-xs font-medium rounded-md opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity shadow-dropdown whitespace-nowrap z-50">
                {hasBadge ? `${elem.name} (${friendRequestCount} pending)` : elem.name}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Actions: User Profile Avatar & Logout */}
      <div className="flex flex-col items-center gap-y-3">
        {/* Current User Profile Avatar Icon */}
        <Link
          href="/profile"
          onClick={(e) => {
            if (pathname.startsWith("/chat")) {
              e.preventDefault();
              if (typeof window !== "undefined") {
                window.dispatchEvent(new CustomEvent("open-my-profile-drawer"));
              }
            }
          }}
          title={username ? `Profile (@${username})` : "Profile"}
          className={`relative group w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-150 ${
            isProfileActive
              ? "bg-primary-50 ring-2 ring-primary-500/50 shadow-xs"
              : "hover:bg-zinc-100/80"
          }`}
        >
          <div className="relative">
            <Profilepic
              username={username || "User"}
              className="w-8 h-8 rounded-full ring-1 ring-zinc-200/80 group-hover:ring-primary-400 transition-all shadow-xs"
            />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
          </div>

          {/* Active Pip */}
          {isProfileActive && (
            <span className="absolute -left-3 w-1 h-5 bg-primary-600 rounded-r-full" />
          )}

          {/* Tooltip */}
          <span className="absolute left-14 px-2 py-1 bg-zinc-900 text-white text-xs font-medium rounded-md opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity shadow-dropdown whitespace-nowrap z-50">
            {username ? `Profile (@${username})` : "Profile"}
          </span>
        </Link>

        {/* Log Out */}
        <Link
          href="/login"
          onClick={logout}
          title="Log out"
          className="group relative w-10 h-10 flex items-center justify-center rounded-xl text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
        >
          <HiArrowLeftOnRectangle className="w-5 h-5" />
          <span className="absolute left-14 px-2 py-1 bg-zinc-900 text-white text-xs font-medium rounded-md opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity shadow-dropdown whitespace-nowrap z-50">
            Log out
          </span>
        </Link>
      </div>
    </aside>
  );
}