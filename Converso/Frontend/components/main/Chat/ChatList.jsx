"use client";

import { getUserDetails } from "@/helper/userauth";
import axios from "axios";
import { usePathname } from "next/navigation";
import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import ChatLabel from "./ChatLabel";
import Profilepic from "@/components/Profilepic";
import { apiUrl } from "@/lib/api";
import socket from "@/lib/socket";
import {
  HiOutlineMagnifyingGlass,
  HiXMark,
  HiUserPlus,
  HiCheck,
  HiOutlineUserGroup,
  HiOutlineBell,
  HiOutlineTrash,
} from "react-icons/hi2";
import { TbMessage2 } from "react-icons/tb";
import { AiOutlineUsergroupAdd } from "react-icons/ai";
import { MdNotificationsNone } from "react-icons/md";
import { toast } from "react-toastify";

export default function ChatList() {
  const pathname = usePathname();
  const searchInputRef = useRef(null);

  // Tab State: "chats" | "requests" | "notifications"
  const [activeTab, setActiveTab] = useState("chats");

  // Chats State
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // Global search state
  const [globalPeers, setGlobalPeers] = useState([]);
  const [searchingGlobal, setSearchingGlobal] = useState(false);
  const [pendingRequests, setPendingRequests] = useState(new Set());

  // Friend Requests State
  const [requests, setRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

  // Notifications State
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  // Listen for focus triggers from header button
  useEffect(() => {
    const handleFocus = () => {
      setActiveTab("chats");
      searchInputRef.current?.focus();
    };
    const handleSwitchTab = (e) => {
      if (e?.detail?.tab) {
        setActiveTab(e.detail.tab);
      }
    };

    window.addEventListener("focus-chat-search", handleFocus);
    window.addEventListener("switch-chat-tab", handleSwitchTab);
    return () => {
      window.removeEventListener("focus-chat-search", handleFocus);
      window.removeEventListener("switch-chat-tab", handleSwitchTab);
    };
  }, []);

  // Fetch active chats
  const fetchChats = useCallback(() => {
    const { username, password } = getUserDetails();
    if (!username) {
      setLoading(false);
      return;
    }

    axios
      .get(apiUrl(`/api/chat?username=${username}&password=${password}`))
      .then((response) => {
        setUsers(response.data?.users || []);
      })
      .catch((error) => {
        console.error("Error loading chats:", error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  // Fetch friend requests
  const fetchRequests = useCallback(() => {
    const currentUser = localStorage.getItem("username");
    if (!currentUser) return;

    setLoadingRequests(true);
    axios
      .get(apiUrl(`/api/friendrequest?username=${currentUser}`))
      .then((res) => {
        setRequests(res.data || []);
      })
      .catch((err) => {
        console.error("Error fetching friend requests:", err);
      })
      .finally(() => {
        setLoadingRequests(false);
      });
  }, []);

  // Fetch notifications
  const fetchNotifications = useCallback(() => {
    const currentUser = localStorage.getItem("username");
    if (!currentUser) return;

    setLoadingNotifications(true);
    axios
      .get(apiUrl(`/api/notification?username=${currentUser}`))
      .then((res) => {
        setNotifications(res.data || []);
      })
      .catch((err) => {
        console.error("Error fetching notifications:", err);
      })
      .finally(() => {
        setLoadingNotifications(false);
      });
  }, []);

  // Initial loads & socket registrations
  useEffect(() => {
    const currentUser = localStorage.getItem("username");
    if (!currentUser) return;

    fetchRequests();
    fetchNotifications();

    if (!socket.connected) {
      socket.connect();
    }
    socket.emit("register-user", currentUser);

    const handleNewRequest = (data) => {
      if (data?.senderDetails) {
        setRequests((prev) => {
          if (prev.some((u) => u.username === data.senderDetails.username)) return prev;
          return [data.senderDetails, ...prev];
        });
      }
      toast.info(`New friend request from @${data?.sender || "someone"}!`, {
        icon: "👋",
      });
      fetchRequests();
    };

    socket.on("new-friend-request", handleNewRequest);

    return () => {
      socket.off("new-friend-request", handleNewRequest);
    };
  }, [fetchRequests, fetchNotifications]);

  // When tab changes to requests or notifications, refresh data
  useEffect(() => {
    if (activeTab === "requests") fetchRequests();
    if (activeTab === "notifications") fetchNotifications();
  }, [activeTab, fetchRequests, fetchNotifications]);

  // Debounced global peer search when typing
  useEffect(() => {
    const cleanQuery = query.trim();
    if (!cleanQuery) {
      setGlobalPeers([]);
      setSearchingGlobal(false);
      return;
    }

    setSearchingGlobal(true);
    const timer = setTimeout(() => {
      const currentUser = localStorage.getItem("username");
      axios
        .get(apiUrl(`/api/search?search=${cleanQuery}&username=${currentUser}`))
        .then((res) => {
          setGlobalPeers(res.data?.users || []);
        })
        .catch((err) => {
          console.error("Global search error:", err);
        })
        .finally(() => {
          setSearchingGlobal(false);
        });
    }, 280);

    return () => clearTimeout(timer);
  }, [query]);

  // Instant local filtering of existing conversations
  const filteredUsers = useMemo(() => {
    if (!query.trim()) return users;
    const q = query.toLowerCase();
    return users.filter(
      (u) =>
        u.username?.toLowerCase().includes(q) ||
        u.fname?.toLowerCase().includes(q) ||
        u.lname?.toLowerCase().includes(q)
    );
  }, [users, query]);

  // Handle inline friend request
  const handleConnect = (peerUsername) => {
    setPendingRequests((prev) => new Set(prev).add(peerUsername));
    const currentUser = localStorage.getItem("username");

    axios
      .post(apiUrl("/api/search"), {
        username: currentUser,
        contactuser: peerUsername,
      })
      .then((res) => {
        if (!res.data?.error) {
          toast.success(`Request sent to @${peerUsername}!`);
        } else {
          toast.error("Failed to send request");
          setPendingRequests((prev) => {
            const next = new Set(prev);
            next.delete(peerUsername);
            return next;
          });
        }
      })
      .catch(() => {
        toast.error("Network error");
        setPendingRequests((prev) => {
          const next = new Set(prev);
          next.delete(peerUsername);
          return next;
        });
      });
  };

  // Handle Accept/Decline Friend Request
  const handleResolveRequest = (reqUser, accepted) => {
    const currentUser = localStorage.getItem("username");
    // Optimistic UI
    setRequests((prev) => prev.filter((r) => r.username !== reqUser.username));

    if (accepted) {
      toast.success(`Connected with ${reqUser.username}!`);
      // Refetch chats to display newly added conversation
      setTimeout(fetchChats, 400);
    } else {
      toast.info("Request declined");
    }

    axios
      .post(apiUrl("/api/friendrequest"), {
        sender: currentUser,
        receiver: reqUser.username,
        accepted: accepted,
      })
      .catch((error) => {
        console.error("Error resolving friend request:", error);
        toast.error("Failed to update request");
        fetchRequests();
      });
  };

  // Clear all notifications
  const handleClearNotifications = () => {
    const currentUser = localStorage.getItem("username");
    axios
      .delete(apiUrl(`/api/notification?username=${currentUser}`))
      .then((response) => {
        if (!response.data?.error) {
          setNotifications([]);
          toast.info("Notifications cleared");
        }
      })
      .catch((error) => {
        console.error("Error clearing notifications:", error);
      });
  };

  const activeChatId = pathname.startsWith("/chat/")
    ? pathname.split("/chat/")[1]
    : null;

  return (
    <div className="flex flex-col h-full">
      {/* Search Bar */}
      <div className="p-3 pb-2 border-b border-zinc-100 dark:border-zinc-800">
        <div className="relative flex items-center">
          <HiOutlineMagnifyingGlass className="absolute left-3 w-4 h-4 text-zinc-400 dark:text-zinc-500 pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (activeTab !== "chats") setActiveTab("chats");
            }}
            placeholder="Search chats or discover peers..."
            className="w-full bg-zinc-100/80 hover:bg-zinc-100 focus:bg-white dark:bg-zinc-800/80 dark:hover:bg-zinc-800 dark:focus:bg-zinc-800 border border-transparent focus:border-zinc-200 dark:focus:border-zinc-700 rounded-xl pl-9 pr-8 py-2 text-xs text-zinc-800 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none transition-all shadow-xs"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-2.5 w-4 h-4 rounded-full bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-zinc-600 dark:text-zinc-300 flex items-center justify-center transition-colors text-[10px]"
              title="Clear search"
            >
              <HiXMark className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Segmented In-Sidebar Switcher Tabs (Peer Section Tabs) */}
      <div className="px-3 py-2 flex items-center gap-1.5 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
        {/* Chats Tab */}
        <button
          type="button"
          onClick={() => setActiveTab("chats")}
          className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === "chats"
              ? "bg-zinc-900 dark:bg-primary-600 text-white shadow-xs"
              : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          }`}
        >
          <TbMessage2 className="w-3.5 h-3.5" />
          <span>Chats</span>
        </button>

        {/* Requests Tab */}
        <button
          type="button"
          onClick={() => setActiveTab("requests")}
          className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 relative ${
            activeTab === "requests"
              ? "bg-zinc-900 dark:bg-primary-600 text-white shadow-xs"
              : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          }`}
        >
          <AiOutlineUsergroupAdd className="w-3.5 h-3.5" />
          <span>Requests</span>
          {requests.length > 0 && (
            <span
              className="min-w-[17px] h-[17px] px-1 rounded-full text-[10px] font-black bg-rose-500 text-white flex items-center justify-center"
            >
              {requests.length > 99 ? "99+" : requests.length}
            </span>
          )}
        </button>

        {/* Alerts / Notifications Tab */}
        <button
          type="button"
          onClick={() => setActiveTab("notifications")}
          className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 relative ${
            activeTab === "notifications"
              ? "bg-zinc-900 dark:bg-primary-600 text-white shadow-xs"
              : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          }`}
        >
          <MdNotificationsNone className="w-3.5 h-3.5" />
          <span>Alerts</span>
          {notifications.length > 0 && (
            <span className="w-2 h-2 rounded-full bg-primary-500" />
          )}
        </button>
      </div>

      {/* Main List Area Based on Active Tab */}
      <div className="flex-1 overflow-y-auto py-2">
        {/* TAB 1: CHATS */}
        {activeTab === "chats" && (
          loading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 animate-pulse px-2">
                  <div className="w-10 h-10 rounded-full bg-zinc-200" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 bg-zinc-200 rounded w-24" />
                    <div className="h-2.5 bg-zinc-100 rounded w-16" />
                  </div>
                </div>
              ))}
            </div>
          ) : !query.trim() ? (
            users.length > 0 ? (
              <ul className="space-y-0.5">
                {users.map((elem) => (
                  <li key={elem.chat_id || elem.username}>
                    <ChatLabel
                      user={elem}
                      active={elem.chat_id == activeChatId}
                    />
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-8 text-center text-xs text-zinc-400">
                No active chats yet. Type a username above to discover peers!
              </div>
            )
          ) : (
            <div className="space-y-4">
              {/* Section 1: Existing Conversations */}
              <div>
                <div className="px-3 pb-1 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                    Chats ({filteredUsers.length})
                  </span>
                </div>

                {filteredUsers.length > 0 ? (
                  <ul className="space-y-0.5">
                    {filteredUsers.map((elem) => (
                      <li key={elem.chat_id || elem.username}>
                        <ChatLabel
                          user={elem}
                          active={elem.chat_id == activeChatId}
                        />
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="px-3 py-2 text-xs text-zinc-400 italic">
                    No active chats match "{query}"
                  </div>
                )}
              </div>

              {/* Section 2: Global Peer Discovery */}
              <div className="pt-2 border-t border-zinc-100">
                <div className="px-3 pb-2 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-primary-600 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary-600 animate-pulse" />
                    Discover Peers ({globalPeers.length})
                  </span>
                  {searchingGlobal && (
                    <span className="text-[10px] text-zinc-400">Searching...</span>
                  )}
                </div>

                {searchingGlobal ? (
                  <div className="p-3 space-y-2">
                    <div className="h-11 bg-zinc-100/70 rounded-xl animate-pulse" />
                    <div className="h-11 bg-zinc-100/70 rounded-xl animate-pulse" />
                  </div>
                ) : globalPeers.length > 0 ? (
                  <div className="space-y-1.5 px-2">
                    {globalPeers.map((peer) => {
                      const isSent = pendingRequests.has(peer.username);
                      const displayName = [peer.fname, peer.lname].filter(Boolean).join(" ") || peer.username;

                      return (
                        <div
                          key={peer.username}
                          className="flex items-center justify-between p-2 rounded-xl bg-zinc-50/70 hover:bg-zinc-100/80 dark:bg-zinc-800/70 dark:hover:bg-zinc-800 transition-colors border border-zinc-100 dark:border-zinc-700/80"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Profilepic
                              gender={peer.gender}
                              name={peer.fname || peer.username}
                              profilePic={peer.profilePic}
                              className="w-8 h-8 rounded-full shadow-2xs"
                            />
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                                {displayName}
                              </p>
                              <p className="text-[11px] text-zinc-400 dark:text-zinc-500 truncate">
                                @{peer.username}
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleConnect(peer.username)}
                            disabled={isSent}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all active:scale-95 shadow-xs ${
                              isSent
                                ? "bg-zinc-200 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400 cursor-not-allowed"
                                : "bg-primary-600 hover:bg-primary-700 text-white shadow-primary-500/20"
                            }`}
                          >
                            {isSent ? (
                              <>
                                <HiCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                <span>Sent</span>
                              </>
                            ) : (
                              <>
                                <HiUserPlus className="w-3 h-3" />
                                <span>Add</span>
                              </>
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="px-3 py-2 text-xs text-zinc-400 dark:text-zinc-500 italic">
                    No peers found matching "{query}"
                  </div>
                )}
              </div>
            </div>
          )
        )}

        {/* TAB 2: FRIEND REQUESTS */}
        {activeTab === "requests" && (
          <div className="px-2 space-y-2">
            <div className="px-2 py-1 flex items-center justify-between">
              <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                Pending Requests ({requests.length})
              </span>
            </div>

            {loadingRequests ? (
              <div className="p-3 space-y-2">
                <div className="h-14 bg-zinc-100 dark:bg-zinc-800 rounded-xl animate-pulse" />
                <div className="h-14 bg-zinc-100 dark:bg-zinc-800 rounded-xl animate-pulse" />
              </div>
            ) : requests.length > 0 ? (
              requests.map((reqUser) => {
                const displayName =
                  [reqUser.fname, reqUser.lname].filter(Boolean).join(" ") ||
                  reqUser.username ||
                  "Peer";

                return (
                  <div
                    key={reqUser.username}
                    className="p-2.5 rounded-xl bg-white dark:bg-zinc-800/90 border border-zinc-200/80 dark:border-zinc-700/80 shadow-2xs hover:shadow-xs transition-all flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Profilepic
                        gender={reqUser.gender}
                        name={reqUser.fname || reqUser.username}
                        profilePic={reqUser.profilePic}
                        className="w-9 h-9 rounded-full shadow-2xs shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                          {displayName}
                        </p>
                        <p className="text-[11px] text-zinc-400 dark:text-zinc-500 truncate">
                          @{reqUser.username}
                        </p>
                      </div>
                    </div>

                    {/* Actions: Accept & Decline */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleResolveRequest(reqUser, true)}
                        className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-600 text-emerald-600 dark:text-emerald-400 hover:text-white flex items-center justify-center transition-colors active:scale-95 shadow-2xs"
                        title="Accept"
                      >
                        <HiCheck className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleResolveRequest(reqUser, false)}
                        className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 flex items-center justify-center transition-colors active:scale-95 shadow-2xs"
                        title="Decline"
                      >
                        <HiXMark className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-zinc-400 dark:text-zinc-500 space-y-2">
                <div className="w-10 h-10 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto text-zinc-400 dark:text-zinc-500">
                  <HiOutlineUserGroup className="w-5 h-5" />
                </div>
                <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  No friend requests
                </p>
                <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
                  When other peers send you requests, they will appear here.
                </p>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: NOTIFICATIONS / ALERTS */}
        {activeTab === "notifications" && (
          <div className="px-2 space-y-2">
            <div className="px-2 py-1 flex items-center justify-between">
              <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                Recent Alerts ({notifications.length})
              </span>
              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearNotifications}
                  className="text-[10px] font-medium text-rose-600 dark:text-rose-400 hover:text-rose-700 flex items-center gap-1 hover:underline"
                >
                  <HiOutlineTrash className="w-3 h-3" />
                  Clear all
                </button>
              )}
            </div>

            {loadingNotifications ? (
              <div className="p-3 space-y-2">
                <div className="h-12 bg-zinc-100 dark:bg-zinc-800 rounded-xl animate-pulse" />
                <div className="h-12 bg-zinc-100 dark:bg-zinc-800 rounded-xl animate-pulse" />
              </div>
            ) : notifications.length > 0 ? (
              notifications.map((item, idx) => (
                <div
                  key={item._id || idx}
                  className="p-3 rounded-xl bg-white dark:bg-zinc-800/90 border border-zinc-200/70 dark:border-zinc-700/80 shadow-2xs hover:shadow-xs transition-all space-y-1"
                >
                  <div className="flex items-start gap-2.5">
                    <div className="w-6 h-6 rounded-lg bg-primary-50 dark:bg-primary-950/50 text-primary-600 dark:text-primary-400 flex items-center justify-center shrink-0 mt-0.5">
                      <HiOutlineBell className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-zinc-800 dark:text-zinc-200 leading-snug">
                        {item.msg || "You have a new alert."}
                      </p>
                      {item.time && (
                        <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">
                          {new Date(item.time).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-zinc-400 dark:text-zinc-500 space-y-2">
                <div className="w-10 h-10 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto text-zinc-400 dark:text-zinc-500">
                  <HiOutlineBell className="w-5 h-5" />
                </div>
                <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  No notifications
                </p>
                <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
                  You're all caught up!
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
