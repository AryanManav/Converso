"use client"
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { HiArrowRight, HiChatBubbleLeftRight } from "react-icons/hi2";
import { apiUrl } from "@/lib/api";

export default function Intro() {
  const router = useRouter();

  useEffect(() => {
    const username = localStorage.getItem("username");
    const password = localStorage.getItem("password");
    if (username && password) {
      axios
        .post(apiUrl("/api/login"), { username, password })
        .then((response) => {
          if (response.data.success) {
            router.push("/chat");
          }
        })
        .catch((error) => {
          console.log(error);
        });
    }
  }, [router]);

  return (
    <section className="relative overflow-hidden pt-24 pb-20 md:pt-32 md:pb-28 bg-white border-b border-zinc-200/70">
      {/* Background Subtle Ambient Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-primary-50/70 via-indigo-50/30 to-transparent blur-3xl -z-10 pointer-events-none" />

      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Hero Column */}
          <div className="lg:col-span-7 flex flex-col items-start text-left">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 border border-primary-200/60 text-primary-700 text-xs font-semibold mb-6">
              <span className="w-2 h-2 rounded-full bg-primary-600 animate-pulse" />
              <span>Real-Time P2P Chat Platform</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-zinc-900 tracking-tight leading-[1.1] mb-6">
              Connect seamlessly. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-indigo-500">
                Chat in real time.
              </span>
            </h1>

            {/* Subtext */}
            <p className="text-base sm:text-lg text-zinc-600 font-normal leading-relaxed max-w-xl mb-8">
              Converso is a minimal, distraction-free messaging and calling space designed for peers, students, and collaborators. Real-time WebRTC audio & video, fast socket delivery, and zero clutter.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-zinc-900 text-white hover:bg-zinc-800 font-medium text-sm transition-all shadow-sm hover:shadow-md active:scale-95"
              >
                Get Started
                <HiArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center px-6 py-3.5 rounded-xl bg-zinc-100 hover:bg-zinc-200/80 text-zinc-800 font-medium text-sm transition-all active:scale-95"
              >
                Log In
              </Link>
            </div>

            {/* Micro Trust Stats */}
            <div className="flex items-center gap-8 mt-12 pt-8 border-t border-zinc-100 text-xs text-zinc-500 font-medium">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Socket.IO Live Delivery</span>
              </div>
              <div>✦ Minimalist UI</div>
              <div>✦ Instant Friends</div>
            </div>
          </div>

          {/* Right Hero Column: Interactive UI Mockup */}
          <div className="lg:col-span-5 w-full flex justify-center">
            <div className="w-full max-w-md bg-white rounded-2xl border border-zinc-200/80 shadow-float p-4 relative">
              {/* Mockup Header */}
              <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-sky-400 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                      A
                    </div>
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-zinc-800">Alex Chen</div>
                    <div className="text-xs text-emerald-600 font-medium">Online now</div>
                  </div>
                </div>
                <HiChatBubbleLeftRight className="w-5 h-5 text-zinc-400" />
              </div>

              {/* Mockup Message Stream */}
              <div className="py-6 space-y-3">
                <div className="flex flex-col items-start max-w-[80%]">
                  <div className="bg-zinc-100 text-zinc-800 text-xs px-3.5 py-2.5 rounded-2xl rounded-tl-sm leading-relaxed">
                    Hey! Have you seen the clean new PeerTalks design?
                  </div>
                  <span className="text-[10px] text-zinc-400 mt-1 ml-1">10:42 AM</span>
                </div>

                <div className="flex flex-col items-end ml-auto max-w-[80%]">
                  <div className="bg-primary-600 text-white text-xs px-3.5 py-2.5 rounded-2xl rounded-tr-sm leading-relaxed shadow-xs">
                    Yes! It feels ultra fast, minimal and so clean now.
                  </div>
                  <span className="text-[10px] text-zinc-400 mt-1 mr-1">10:43 AM</span>
                </div>

                {/* Mock Typing Indicator */}
                <div className="inline-flex items-center gap-1.5 px-3 py-2 bg-zinc-100 rounded-full text-zinc-500 text-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>

              {/* Mock Input Bar */}
              <div className="flex items-center gap-2 p-1.5 bg-zinc-50 rounded-xl border border-zinc-200/70">
                <input
                  disabled
                  placeholder="Type a message..."
                  className="bg-transparent text-xs text-zinc-500 px-3 py-1.5 w-full focus:outline-none cursor-default"
                />
                <button
                  type="button"
                  className="w-7 h-7 rounded-lg bg-primary-600 text-white flex items-center justify-center shrink-0 shadow-xs"
                >
                  <HiArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

