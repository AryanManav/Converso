"use client"

import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ThreeDots } from "react-loader-spinner";
import { HiOutlineUser, HiOutlineLockClosed, HiEye, HiEyeSlash } from "react-icons/hi2";
import { apiUrl } from "@/lib/api";

export default function Login() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Clean up any sensitive query params that may have leaked into the URL
  useEffect(() => {
    if (typeof window !== "undefined" && window.location.search) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const login = (event) => {
    event.preventDefault();
    setLoading(true);
    setErrorMessage("");

    const formData = new FormData(event.target);
    const formObject = {};
    formData.forEach((value, key) => {
      formObject[key] = value;
    });

    axios
      .post(apiUrl("/api/login"), {
        username: formObject.username,
        password: formObject.password,
      })
      .then((response) => {
        if (response.data.success) {
          localStorage.setItem("username", formObject.username);
          localStorage.setItem("password", formObject.password);
          router.push("/chat");
        } else {
          setErrorMessage(response.data.error || "Incorrect username or password. Please try again.");
        }
      })
      .catch((err) => {
        console.error("Login network error:", err);
        setErrorMessage(
          err.response?.data?.error ||
          "Network Error: Could not connect to backend server. Make sure the backend is running!"
        );
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-zinc-50 px-4 py-12 relative overflow-hidden">
      {/* Background Subtle Gradient Blobs */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary-100/50 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-indigo-100/50 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="w-full max-w-md bg-white rounded-2xl border border-zinc-200/80 shadow-dropdown p-8 sm:p-10 animate-fadeIn">
        {/* Brand Icon & Heading */}
        <div className="flex flex-col items-center text-center mb-8">
          <Link
            href="/"
            className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary-600 to-primary-500 text-white flex items-center justify-center font-bold text-xl shadow-md shadow-primary-500/20 mb-4 hover:scale-105 transition-transform"
          >
            P
          </Link>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">
            Welcome back
          </h1>
          <p className="text-sm text-zinc-500 mt-1.5">
            Log in to continue chatting with your peers
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-6 p-3.5 bg-rose-50 border border-rose-200/70 rounded-xl text-xs font-medium text-rose-700 flex items-center justify-center text-center animate-wiggle">
            {errorMessage}
          </div>
        )}

        <form method="POST" action="#" onSubmit={login} className="space-y-4">
          {/* Username */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1.5">
              Username
            </label>
            <div className="relative flex items-center">
              <HiOutlineUser className="absolute left-3.5 w-5 h-5 text-zinc-400 pointer-events-none" />
              <input
                type="text"
                name="username"
                required
                placeholder="Enter your username"
                onChange={() => setError(false)}
                className="w-full bg-zinc-50/70 border border-zinc-200 rounded-xl pl-11 pr-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative flex items-center">
              <HiOutlineLockClosed className="absolute left-3.5 w-5 h-5 text-zinc-400 pointer-events-none" />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                required
                placeholder="••••••••"
                onChange={() => setError(false)}
                className="w-full bg-zinc-50/70 border border-zinc-200 rounded-xl pl-11 pr-11 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 text-zinc-400 hover:text-zinc-600 transition-colors"
              >
                {showPassword ? (
                  <HiEyeSlash className="w-5 h-5" />
                ) : (
                  <HiEye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 py-3.5 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-semibold transition-all shadow-sm hover:shadow active:scale-[0.99] flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <ThreeDots height={20} width={36} color="#ffffff" visible={true} />
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        {/* Footer link */}
        <div className="mt-8 text-center text-xs text-zinc-500">
          Don't have an account?{" "}
          <Link
            href="/register"
            className="font-semibold text-primary-600 hover:text-primary-700 transition-colors"
          >
            Create one now
          </Link>
        </div>
      </div>
    </div>
  );
}

