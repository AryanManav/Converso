"use client";

import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ThreeDots } from "react-loader-spinner";
import { HiOutlineUser, HiOutlineLockClosed } from "react-icons/hi2";
import { apiUrl } from "@/lib/api";

export default function Register() {
  const [errorClient, setErrorClient] = useState(false);
  const [errorServer, setErrorServer] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const submit = (event) => {
    event.preventDefault();
    setLoading(true);
    setErrorClient(false);
    setErrorServer(false);

    const formData = new FormData(event.target);
    const formObject = {};
    formData.forEach((value, key) => {
      formObject[key] = value;
    });

    if (formObject.password !== formObject.cpassword) {
      setErrorClient(true);
      setLoading(false);
      return;
    }

    axios
      .post(apiUrl("/api/register"), formObject)
      .then((response) => {
        if (response.data.error) {
          setErrorServer(true);
        } else {
          localStorage.setItem("username", response.data.username);
          localStorage.setItem("password", response.data.password);
          router.push("/register/setprofile");
        }
      })
      .catch((err) => {
        console.error(err);
        setErrorServer(true);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-zinc-50 px-4 py-12 relative overflow-hidden">
      {/* Ambient background blur */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary-100/50 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-indigo-100/50 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="w-full max-w-md bg-white rounded-2xl border border-zinc-200/80 shadow-dropdown p-8 sm:p-10 animate-fadeIn">
        {/* Brand & Heading */}
        <div className="flex flex-col items-center text-center mb-8">
          <Link
            href="/"
            className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary-600 to-primary-500 text-white flex items-center justify-center font-bold text-xl shadow-md shadow-primary-500/20 mb-4 hover:scale-105 transition-transform"
          >
            P
          </Link>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">
            Create an account
          </h1>
          <p className="text-sm text-zinc-500 mt-1.5">
            Connect and start chatting with peers in real time
          </p>
        </div>

        {/* Alerts */}
        {errorServer && (
          <div className="mb-6 p-3.5 bg-rose-50 border border-rose-200/70 rounded-xl text-xs font-medium text-rose-700 flex items-center justify-center animate-wiggle">
            Username already exists! Please choose another.
          </div>
        )}

        {errorClient && (
          <div className="mb-6 p-3.5 bg-rose-50 border border-rose-200/70 rounded-xl text-xs font-medium text-rose-700 flex items-center justify-center animate-wiggle">
            Passwords do not match! Please check again.
          </div>
        )}

        <form method="POST" action="#" onSubmit={submit} className="space-y-4">
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
                placeholder="Choose a username"
                onChange={() => setErrorServer(false)}
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
                type="password"
                name="password"
                required
                placeholder="Create a password"
                onChange={() => setErrorClient(false)}
                className="w-full bg-zinc-50/70 border border-zinc-200 rounded-xl pl-11 pr-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
              />
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1.5">
              Confirm Password
            </label>
            <div className="relative flex items-center">
              <HiOutlineLockClosed className="absolute left-3.5 w-5 h-5 text-zinc-400 pointer-events-none" />
              <input
                type="password"
                name="cpassword"
                required
                placeholder="Repeat password"
                onChange={() => setErrorClient(false)}
                className="w-full bg-zinc-50/70 border border-zinc-200 rounded-xl pl-11 pr-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
              />
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
              "Create Account"
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-zinc-500">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold text-primary-600 hover:text-primary-700 transition-colors"
          >
            Log in instead
          </Link>
        </div>
      </div>
    </div>
  );
}

