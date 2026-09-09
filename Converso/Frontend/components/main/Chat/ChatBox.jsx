"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import socket from "@/lib/socket";
import {
  HiPaperAirplane,
  HiChevronDown,
  HiOutlineClipboardDocument,
  HiCheck,
  HiOutlineFaceSmile,
  HiOutlineSparkles,
} from "react-icons/hi2";
import { apiUrl } from "@/lib/api";
import EmojiPicker from "./EmojiPicker";

// Date formatting helper for chat dividers
const formatDateDivider = (dateInput) => {
  if (!dateInput) return "";
  const date = new Date(dateInput);
  const now = new Date();
  if (isNaN(date.getTime())) return "";

  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (isToday) return "Today";

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  if (isYesterday) return "Yesterday";

  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const isDifferentDay = (d1, d2) => {
  if (!d1 || !d2) return true;
  const date1 = new Date(d1);
  const date2 = new Date(d2);
  if (isNaN(date1.getTime()) || isNaN(date2.getTime())) return true;
  return (
    date1.getDate() !== date2.getDate() ||
    date1.getMonth() !== date2.getMonth() ||
    date1.getFullYear() !== date2.getFullYear()
  );
};

const QUICK_REACTIONS = ["❤️", "👍", "😂", "🔥", "👏"];

const STARTER_PROMPTS = [
  "👋 Hey there! How are you doing?",
  "✨ Hope you're having a wonderful day!",
  "🚀 Let's connect and collaborate!",
];

export default function ChatBox({ chatid }) {
  const [messages, setMessages] = useState([]);
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sending, setSending] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("connecting");
  const [typingUser, setTypingUser] = useState(null);

  // UI/UX Enhancement States
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [unreadBelowCount, setUnreadBelowCount] = useState(0);
  const [copiedIdx, setCopiedIdx] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [reactions, setReactions] = useState({}); // { [msgIdx]: { [emoji]: count } }

  const chatboxRef = useRef(null);
  const textboxRef = useRef(null);
  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const debounceTimeout = useRef(null);
  const isAtBottomRef = useRef(true);

  // Scroll to bottom helper
  const scrollToBottom = useCallback((smooth = false) => {
    if (chatboxRef.current) {
      if (smooth) {
        chatboxRef.current.scrollTo({
          top: chatboxRef.current.scrollHeight,
          behavior: "smooth",
        });
      } else {
        chatboxRef.current.scrollTop = chatboxRef.current.scrollHeight;
      }
      isAtBottomRef.current = true;
      setShowScrollBottom(false);
      setUnreadBelowCount(0);
    }
  }, []);

  // Track scroll position to trigger floating scroll-to-bottom button
  const handleScroll = useCallback(() => {
    if (!chatboxRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatboxRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    const atBottom = distanceFromBottom < 120;
    isAtBottomRef.current = atBottom;
    setShowScrollBottom(!atBottom);
    if (atBottom) {
      setUnreadBelowCount(0);
    }
  }, []);

  // Fetch initial messages via HTTP
  const fetchInitialMessages = useCallback(async () => {
    try {
      const user =
        typeof window !== "undefined" ? localStorage.getItem("username") : null;
      if (!user) {
        setError("Username not found");
        setLoading(false);
        return;
      }

      const response = await fetch(
        apiUrl(`/api/chat/messages?chatid=${chatid}&sender=${user}`)
      );
      const data = await response.json();

      if (!data.error) {
        setMessages(data.messages || []);
        setTimeout(() => scrollToBottom(false), 100);
      } else {
        setError(data.error);
      }
    } catch (err) {
      console.error("Error fetching messages:", err);
      setError("Failed to load messages");
    } finally {
      setLoading(false);
    }
  }, [chatid, scrollToBottom]);

  // Initialize Socket.IO connection
  useEffect(() => {
    if (typeof window !== "undefined") {
      const user = localStorage.getItem("username");
      setUsername(user || "");

      if (!user) {
        setError("Username not found");
        return;
      }

      fetchInitialMessages();

      if (!socket.connected) {
        socket.connect();
      }

      socketRef.current = socket;
      setConnectionStatus(socket.connected ? "connected" : "connecting");

      const handleConnect = () => {
        setConnectionStatus("connected");
        socket.emit("join-chat", { chatId: chatid, username: user });
      };

      const handleConnectError = (err) => {
        console.error("Socket error:", err);
        setConnectionStatus("error");
      };

      const handleDisconnect = () => {
        setConnectionStatus("disconnected");
      };

      const handleReceiveMessage = (data) => {
        setMessages((prev) => [
          ...prev,
          {
            content: data.message,
            is_sender: data.sender === user,
            SENDER: data.sender,
            CHAT_ID: data.chatId,
            time: new Date().toISOString(),
          },
        ]);

        if (!isAtBottomRef.current) {
          setUnreadBelowCount((prev) => prev + 1);
        } else {
          setTimeout(() => scrollToBottom(false), 50);
        }
      };

      const handleUserTyping = (data) => {
        const { username: typingUsername, chatId } = data;
        if (chatId === chatid && typingUsername !== user) {
          setTypingUser(typingUsername);
          if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
          }
          typingTimeoutRef.current = setTimeout(() => {
            setTypingUser(null);
          }, 2000);
        }
      };

      if (socket.connected) {
        socket.emit("join-chat", { chatId: chatid, username: user });
      }

      socket.on("connect", handleConnect);
      socket.on("connect_error", handleConnectError);
      socket.on("disconnect", handleDisconnect);
      socket.on("receive-message", handleReceiveMessage);
      socket.on("user-typing", handleUserTyping);

      return () => {
        socket.off("connect", handleConnect);
        socket.off("connect_error", handleConnectError);
        socket.off("disconnect", handleDisconnect);
        socket.off("receive-message", handleReceiveMessage);
        socket.off("user-typing", handleUserTyping);
        socket.emit("leave-chat", { chatId: chatid, username: user });
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
      };
    }
  }, [chatid, fetchInitialMessages, scrollToBottom]);

  // Handle typing events with debouncing
  const handleTyping = () => {
    if (!socketRef.current?.connected || !username) return;

    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    socketRef.current.emit("typing", {
      chatId: chatid,
      username: username,
    });

    debounceTimeout.current = setTimeout(() => {}, 1000);
  };

  // Send message
  const sendMessage = async (event, customText = null) => {
    if (event) event.preventDefault();

    const messageText = (customText || textboxRef.current?.value || "").trim();
    if (!messageText || !username) return;

    if (!socketRef.current?.connected) {
      alert("Connection interrupted. Trying to reconnect...");
      return;
    }

    setSending(true);

    try {
      const response = await fetch(apiUrl("/api/chat/messages"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: messageText,
          chatid: chatid,
          sender: username,
        }),
      });

      const data = await response.json();

      if (!data.error) {
        socketRef.current.emit("send-message", {
          chatId: chatid,
          message: messageText,
          sender: username,
        });

        setTypingUser(null);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        if (textboxRef.current) textboxRef.current.value = "";
        setShowEmojiPicker(false);
        setTimeout(() => scrollToBottom(true), 50);
      } else {
        alert("Failed to send message. Please try again.");
      }
    } catch (err) {
      console.error("Error sending message:", err);
      alert("Failed to send message. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(e);
    }
  };

  // Copy message to clipboard
  const handleCopyMessage = async (content, idx) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedIdx(idx);
      setTimeout(() => {
        setCopiedIdx(null);
      }, 1500);
    } catch (err) {
      console.error("Failed to copy text:", err);
    }
  };

  // Toggle quick emoji reaction on a message
  const handleToggleReaction = (idx, emoji) => {
    setReactions((prev) => {
      const current = prev[idx] || {};
      const newCount = (current[emoji] || 0) + 1;
      return {
        ...prev,
        [idx]: {
          ...current,
          [emoji]: newCount,
        },
      };
    });
  };

  // Select emoji from picker
  const handleSelectEmoji = (emoji) => {
    if (!textboxRef.current) return;
    const input = textboxRef.current;
    const start = input.selectionStart || input.value.length;
    const end = input.selectionEnd || input.value.length;
    const currentValue = input.value;
    const updatedValue =
      currentValue.substring(0, start) + emoji + currentValue.substring(end);
    input.value = updatedValue;
    const newCursorPos = start + emoji.length;
    input.setSelectionRange(newCursorPos, newCursorPos);
    input.focus();
    handleTyping();
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-zinc-50 dark:bg-[#0f1218]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 rounded-full border-2 border-primary-600 border-t-transparent animate-spin" />
          <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 tracking-wide">
            Loading messages...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center bg-zinc-50 dark:bg-[#0f1218] p-6">
        <div className="text-center max-w-sm bg-white dark:bg-zinc-850 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-700 shadow-xl">
          <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-1">
            Could not load conversation
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-5">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 bg-zinc-900 dark:bg-primary-600 text-white text-xs font-bold rounded-xl hover:bg-zinc-800 dark:hover:bg-primary-700 transition-all shadow-xs active:scale-95"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] bg-zinc-50 dark:bg-[#0f1218] bg-[radial-gradient(#e4e4e7_1px,transparent_1px)] dark:bg-[radial-gradient(#232936_1.5px,transparent_1.5px)] [background-size:22px_22px] overflow-hidden relative">
      {/* Minimal Connection Warning (only if disconnected) */}
      {connectionStatus !== "connected" && (
        <div className="bg-amber-50 dark:bg-amber-950/70 border-b border-amber-200 dark:border-amber-800/80 px-4 py-2 flex items-center justify-center gap-2 text-xs font-semibold text-amber-800 dark:text-amber-200 z-20 backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          <span>
            {connectionStatus === "connecting"
              ? "Connecting to live chat..."
              : "Reconnecting..."}
          </span>
        </div>
      )}

      {/* Message Stream */}
      <div
        className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-3.5 relative"
        ref={chatboxRef}
        onScroll={handleScroll}
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 select-none animate-fadeIn">
            {/* Greeting Card */}
            <div className="max-w-sm w-full bg-white dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700/80 rounded-3xl p-6 shadow-xl backdrop-blur-md flex flex-col items-center">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-primary-600 to-indigo-600 text-white flex items-center justify-center mb-3 shadow-lg shadow-primary-500/20">
                <HiOutlineSparkles className="w-7 h-7" />
              </div>

              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-1">
                Say hello!
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-300 mb-5 leading-relaxed">
                This is the beginning of your conversation. Pick a starter prompt or type your message below.
              </p>

              {/* Starter Prompts */}
              <div className="w-full space-y-2">
                {STARTER_PROMPTS.map((prompt, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      if (textboxRef.current) {
                        textboxRef.current.value = prompt;
                        textboxRef.current.focus();
                      }
                    }}
                    className="w-full text-left px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-750 hover:bg-primary-50 dark:hover:bg-primary-950/50 border border-zinc-200 dark:border-zinc-650 text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:text-primary-600 dark:hover:text-primary-400 transition-all active:scale-98 shadow-2xs"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          messages.map((elem, idx, arr) => {
            const isPrevSameSender =
              arr[idx - 1] && arr[idx - 1].is_sender === elem.is_sender;
            const timeString = elem.time
              ? new Date(elem.time).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "";

            // Check if day changed from previous message
            const showDateDivider =
              idx === 0 || isDifferentDay(arr[idx - 1]?.time, elem.time);

            const msgReactions = reactions[idx] || {};

            return (
              <div key={idx}>
                {/* 1. Date Divider */}
                {showDateDivider && (
                  <div className="flex items-center justify-center my-4 select-none">
                    <span className="px-4 py-1.5 rounded-full bg-zinc-200/90 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-xs font-semibold tracking-wide text-zinc-700 dark:text-zinc-200 shadow-sm backdrop-blur-md">
                      {formatDateDivider(elem.time)}
                    </span>
                  </div>
                )}

                {/* 2. Message Container */}
                <div
                  className={`group relative flex flex-col ${
                    elem.is_sender ? "items-end" : "items-start"
                  } ${isPrevSameSender ? "mt-1" : "mt-3"}`}
                >
                  <div
                    className={`flex items-center gap-2 max-w-[85%] sm:max-w-[70%] ${
                      elem.is_sender ? "flex-row" : "flex-row-reverse"
                    }`}
                  >
                    {/* Hover Actions Toolbar (Reactions & Copy) */}
                    <div
                      className={`opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center gap-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-full px-2 py-1 shadow-md backdrop-blur-xs ${
                        copiedIdx === idx ? "!opacity-100" : ""
                      }`}
                    >
                      {/* Quick Reactions */}
                      <div className="hidden sm:flex items-center gap-0.5 border-r border-zinc-200 dark:border-zinc-700 pr-1.5 mr-0.5">
                        {QUICK_REACTIONS.map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => handleToggleReaction(idx, emoji)}
                            className="w-5 h-5 flex items-center justify-center text-xs hover:scale-125 transition-transform active:scale-95 select-none"
                            title={`React with ${emoji}`}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>

                      {/* Copy to Clipboard button */}
                      <button
                        type="button"
                        onClick={() => handleCopyMessage(elem.content, idx)}
                        className="p-1 rounded-full text-zinc-400 hover:text-zinc-700 dark:text-zinc-300 dark:hover:text-white transition-colors"
                        title={copiedIdx === idx ? "Copied!" : "Copy text"}
                      >
                        {copiedIdx === idx ? (
                          <HiCheck className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <HiOutlineClipboardDocument className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    {/* Message Bubble Content */}
                    <div
                      className={`relative px-4 py-2.5 text-[13.5px] leading-relaxed shadow-sm break-words transition-all ${
                        elem.is_sender
                          ? "bg-gradient-to-tr from-primary-600 to-indigo-600 text-white rounded-2xl rounded-br-xs shadow-primary-500/20"
                          : "bg-white dark:bg-[#1e232d] text-zinc-900 dark:text-zinc-50 border border-zinc-200/80 dark:border-[#2b3240] shadow-sm rounded-2xl rounded-bl-xs"
                      }`}
                    >
                      <span className="whitespace-pre-wrap select-text font-normal">
                        {elem.content}
                      </span>
                    </div>
                  </div>

                  {/* Reaction Badges Pill (if any) */}
                  {Object.keys(msgReactions).length > 0 && (
                    <div
                      className={`flex flex-wrap items-center gap-1 mt-1 px-1 ${
                        elem.is_sender ? "justify-end" : "justify-start"
                      }`}
                    >
                      {Object.entries(msgReactions).map(([emoji, count]) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => handleToggleReaction(idx, emoji)}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs shadow-2xs hover:scale-105 transition-transform"
                        >
                          <span>{emoji}</span>
                          <span className="text-[10px] font-bold text-zinc-600 dark:text-zinc-300">
                            {count}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Timestamp & Status Checkmark */}
                  {timeString && (
                    <div
                      className={`flex items-center gap-1 text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mt-1 px-1 select-none ${
                        elem.is_sender ? "justify-end" : "justify-start"
                      }`}
                    >
                      <span>{timeString}</span>
                      {elem.is_sender && (
                        <span
                          className="inline-flex items-center text-primary-500 dark:text-primary-400 ml-0.5"
                          title="Delivered"
                        >
                          <svg
                            className="w-3.5 h-3.5 stroke-current"
                            viewBox="0 0 24 24"
                            fill="none"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M18 6L7 17l-5-5" />
                            <path d="M22 10l-7.5 7.5-2-2" />
                          </svg>
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}

        {/* Animated Typing Indicator */}
        {typingUser && (
          <div className="flex items-center gap-2 pt-1 animate-fadeIn">
            <div className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-full px-4 py-1.5 shadow-sm flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-300 backdrop-blur-xs">
              <span className="font-semibold text-zinc-800 dark:text-zinc-100">
                @{typingUser}
              </span>
              <span className="text-zinc-400 dark:text-zinc-400">is typing</span>
              <span className="inline-flex gap-1 items-center ml-1">
                <span
                  className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-bounce"
                  style={{ animationDelay: "0ms" }}
                />
                <span
                  className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-bounce"
                  style={{ animationDelay: "150ms" }}
                />
                <span
                  className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-bounce"
                  style={{ animationDelay: "300ms" }}
                />
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 3. Floating Scroll-To-Bottom Button */}
      {showScrollBottom && (
        <button
          type="button"
          onClick={() => scrollToBottom(true)}
          className="absolute bottom-24 right-6 sm:right-8 z-30 flex items-center gap-1.5 px-4 py-2 rounded-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-100 shadow-xl hover:shadow-2xl hover:bg-zinc-50 dark:hover:bg-zinc-750 active:scale-95 transition-all text-xs font-semibold animate-fadeIn backdrop-blur-md"
          title="Scroll to bottom"
        >
          <HiChevronDown className="w-4 h-4 text-primary-600 dark:text-primary-400" />
          {unreadBelowCount > 0 && (
            <span className="bg-gradient-to-r from-primary-600 to-indigo-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center shadow-xs">
              {unreadBelowCount} new
            </span>
          )}
        </button>
      )}

      {/* 4. Bottom Glassmorphic Input Bar */}
      <div className="p-3 sm:p-4 sm:px-8 border-t border-zinc-200/80 dark:border-zinc-800 bg-white/95 dark:bg-[#12161f]/95 backdrop-blur-xl relative z-10">
        {/* Emoji Picker Popover */}
        {showEmojiPicker && (
          <EmojiPicker
            onSelect={handleSelectEmoji}
            onClose={() => setShowEmojiPicker(false)}
          />
        )}

        <form
          onSubmit={sendMessage}
          className="max-w-4xl mx-auto flex items-center gap-1.5 sm:gap-2 bg-zinc-100 dark:bg-[#1c222c] border border-zinc-200 dark:border-[#2b3342] rounded-2xl p-1.5 focus-within:bg-white dark:focus-within:bg-[#202733] focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-500/20 transition-all shadow-xs"
        >
          {/* Emoji Toggle Button */}
          <button
            type="button"
            onClick={() => setShowEmojiPicker((prev) => !prev)}
            disabled={connectionStatus !== "connected"}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all shrink-0 ${
              showEmojiPicker
                ? "bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400"
                : "text-zinc-500 dark:text-zinc-300 hover:bg-zinc-200/70 dark:hover:bg-zinc-700/70 hover:text-zinc-900 dark:hover:text-white"
            }`}
            title="Add Emoji"
          >
            <HiOutlineFaceSmile className="w-5 h-5" />
          </button>

          <input
            ref={textboxRef}
            type="text"
            placeholder="Write a message... (Press Enter to send)"
            disabled={sending || connectionStatus !== "connected"}
            onKeyDown={handleKeyDown}
            onChange={handleTyping}
            className="flex-1 bg-transparent px-2 sm:px-3 py-2 text-[13.5px] text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-400 focus:outline-none disabled:opacity-50"
            autoComplete="off"
          />

          <button
            type="submit"
            disabled={sending || connectionStatus !== "connected"}
            className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 active:scale-95 text-white flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-primary-500/20 shrink-0"
            title="Send message"
          >
            {sending ? (
              <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
            ) : (
              <HiPaperAirplane className="w-4 h-4 -rotate-45 ml-0.5" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
