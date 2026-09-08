"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { io } from "socket.io-client"
import { HiPaperAirplane } from "react-icons/hi2";
import { apiUrl } from "@/lib/api";

export default function ChatBox({ chatid }) {
    const [messages, setMessages] = useState([]);
    const [username, setUsername] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [sending, setSending] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState("connecting");
    const [typingUser, setTypingUser] = useState(null);
    
    const chatboxRef = useRef(null);
    const textboxRef = useRef(null);
    const socketRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const debounceTimeout = useRef(null);

    // Scroll to bottom helper
    const scrollToBottom = useCallback(() => {
        if (chatboxRef.current) {
            chatboxRef.current.scrollTop = chatboxRef.current.scrollHeight;
        }
    }, []);

    // Fetch initial messages via HTTP
    const fetchInitialMessages = useCallback(async () => {
        try {
            const user = typeof window !== 'undefined' ? localStorage.getItem("username") : null;
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
                setTimeout(scrollToBottom, 100);
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
        if (typeof window !== 'undefined') {
            const user = localStorage.getItem("username");
            setUsername(user || "");
            
            if (!user) {
                setError("Username not found");
                return;
            }

            fetchInitialMessages();

            const BACKEND_URL = process.env.NEXT_PUBLIC_SOCKET_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
            const socket = io(BACKEND_URL, {
                transports: ["websocket", "polling"],
            });

            socketRef.current = socket;

            socket.on("connect", () => {
                setConnectionStatus("connected");
                socket.emit("join-chat", { chatId: chatid, username: user });
            });

            socket.on("connect_error", (err) => {
                console.error("Socket error:", err);
                setConnectionStatus("error");
            });

            socket.on("disconnect", () => {
                setConnectionStatus("disconnected");
            });

            socket.on("receive-message", (data) => {
                setMessages(prev => [...prev, {
                    content: data.message,
                    is_sender: data.sender === user,
                    SENDER: data.sender,
                    CHAT_ID: data.chatId,
                    time: new Date().toISOString()
                }]);
                setTimeout(scrollToBottom, 50);
            });

            socket.on("user-typing", (data) => {
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
            });

            return () => {
                socket.off("receive-message");
                socket.off("user-typing");
                if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
                if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
                socket.disconnect();
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
            username: username
        });
        
        debounceTimeout.current = setTimeout(() => {}, 1000);
    };

    // Send message
    const sendMessage = async (event) => {
        if (event) event.preventDefault();

        const messageText = textboxRef.current?.value?.trim();
        if (!messageText || !username) return;

        if (!socketRef.current?.connected) {
            alert("Connection interrupted. Trying to reconnect...");
            return;
        }

        setSending(true);

        try {
            const response = await fetch(apiUrl("/api/chat/messages"), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: messageText,
                    chatid: chatid,
                    sender: username
                })
            });

            const data = await response.json();

            if (!data.error) {
                socketRef.current.emit("send-message", {
                    chatId: chatid,
                    message: messageText,
                    sender: username
                });

                setTypingUser(null);
                if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
                if (textboxRef.current) textboxRef.current.value = '';
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
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage(e);
        }
    };

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center bg-zinc-50">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 rounded-full border-2 border-primary-600 border-t-transparent animate-spin" />
                    <p className="text-xs font-medium text-zinc-400">Loading messages...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex-1 flex items-center justify-center bg-zinc-50 p-6">
                <div className="text-center max-w-sm bg-white p-6 rounded-2xl border border-zinc-200/80 shadow-subtle">
                    <p className="text-sm font-semibold text-zinc-900 mb-1">Could not load chat</p>
                    <p className="text-xs text-zinc-500 mb-4">{error}</p>
                    <button 
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-zinc-900 text-white text-xs font-medium rounded-xl hover:bg-zinc-800 transition-colors"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] bg-zinc-50/50 dark:bg-zinc-950 overflow-hidden relative">
            {/* Minimal Connection Warning (only if disconnected) */}
            {connectionStatus !== 'connected' && (
                <div className="bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200/60 dark:border-amber-900/50 px-4 py-1.5 flex items-center justify-center gap-2 text-xs font-medium text-amber-800 dark:text-amber-200 z-20">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    <span>{connectionStatus === 'connecting' ? 'Connecting to live chat...' : 'Reconnecting...'}</span>
                </div>
            )}

            {/* Message Stream */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-3" ref={chatboxRef}>
                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center text-zinc-400 dark:text-zinc-500 py-12 select-none">
                        <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center text-zinc-400 dark:text-zinc-500 mb-3">
                            <HiPaperAirplane className="w-5 h-5 -rotate-45" />
                        </div>
                        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">No messages yet</p>
                        <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1 max-w-xs">
                            Start the conversation by sending a message below!
                        </p>
                    </div>
                ) : (
                    messages.map((elem, idx, arr) => {
                        const isPrevSameSender = arr[idx - 1] && arr[idx - 1].is_sender === elem.is_sender;
                        const timeString = elem.time ? new Date(elem.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

                        return (
                            <div
                                key={idx}
                                className={`flex flex-col ${elem.is_sender ? "items-end" : "items-start"} ${isPrevSameSender ? "mt-1" : "mt-3"}`}
                            >
                                <div
                                    className={`relative max-w-[80%] sm:max-w-[65%] px-4 py-2.5 text-sm leading-relaxed shadow-xs break-words ${
                                        elem.is_sender
                                            ? "bg-primary-600 text-white rounded-2xl rounded-br-sm"
                                            : "bg-white dark:bg-zinc-800/95 text-zinc-900 dark:text-zinc-100 border border-zinc-200/80 dark:border-zinc-700/80 rounded-2xl rounded-bl-sm"
                                    }`}
                                >
                                    <span className="whitespace-pre-wrap">{elem.content}</span>
                                </div>
                                {timeString && (
                                    <span className={`text-[10px] text-zinc-400 dark:text-zinc-500 mt-1 px-1 ${elem.is_sender ? "text-right" : "text-left"}`}>
                                        {timeString}
                                    </span>
                                )}
                            </div>
                        );
                    })
                )}

                {/* Animated Typing Indicator */}
                {typingUser && (
                    <div className="flex items-center gap-2 pt-1 animate-fadeIn">
                        <div className="bg-white dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700/80 rounded-full px-3.5 py-1.5 shadow-subtle flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                            <span className="font-medium text-zinc-700 dark:text-zinc-200">@{typingUser}</span>
                            <span className="inline-flex gap-1 items-center ml-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 dark:bg-zinc-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                                <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 dark:bg-zinc-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                                <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 dark:bg-zinc-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom Floating Input Bar */}
            <div className="p-4 sm:px-8 border-t border-zinc-200/70 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md">
                <form
                    onSubmit={sendMessage}
                    className="max-w-4xl mx-auto flex items-center gap-2 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200/80 dark:border-zinc-700/80 rounded-2xl p-1.5 focus-within:bg-white dark:focus-within:bg-zinc-800 focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-500/10 transition-all shadow-subtle"
                >
                    <input
                        ref={textboxRef}
                        type="text"
                        placeholder="Write a message... (Press Enter to send)"
                        disabled={sending || connectionStatus !== 'connected'}
                        onKeyDown={handleKeyDown}
                        onChange={handleTyping}
                        className="flex-1 bg-transparent px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none disabled:opacity-50"
                        autoComplete="off"
                    />

                    <button
                        type="submit"
                        disabled={sending || connectionStatus !== 'connected'}
                        className="w-10 h-10 rounded-xl bg-zinc-900 dark:bg-primary-600 hover:bg-zinc-800 dark:hover:bg-primary-700 active:scale-95 text-white flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-xs shrink-0"
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

