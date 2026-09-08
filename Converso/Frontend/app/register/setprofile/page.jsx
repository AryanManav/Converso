"use client";

import axios from "axios";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ThreeDots } from "react-loader-spinner";
import Link from "next/link";
import { apiUrl } from "@/lib/api";
import DateOfBirthSelector from "@/components/utils/DateOfBirthSelector";

export default function UserProfile() {
  const [loading, setLoading] = useState(false);
  const [dob, setDob] = useState("");
  const router = useRouter();

  const submit = (event) => {
    event.preventDefault();
    setLoading(true);
    const formData = new FormData(event.target);
    const formObject = {};
    formData.forEach((value, key) => {
      formObject[key] = value;
    });

    if (dob) {
      formObject.dob = dob;
    }

    formObject.username = localStorage.getItem("username");

    axios
      .post(apiUrl("/api/register/setprofile"), formObject)
      .then((response) => {
        if (response.data.error) {
          console.error(response.data.error);
        } else {
          router.push("/chat");
        }
      })
      .catch((err) => {
        console.error(err);
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

      <div className="w-full max-w-lg bg-white rounded-2xl border border-zinc-200/80 shadow-dropdown p-8 sm:p-10 animate-fadeIn">
        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-zinc-100">
          <div>
            <span className="text-xs font-semibold text-primary-600 uppercase tracking-wider">
              Step 2 of 2
            </span>
            <h1 className="text-2xl font-bold text-zinc-900 tracking-tight mt-1">
              Set up your profile
            </h1>
            <p className="text-xs text-zinc-500 mt-1">
              Tell your peers a little more about yourself
            </p>
          </div>
          <div className="w-10 h-10 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center font-bold text-sm">
            2/2
          </div>
        </div>

        <form method="POST" action="#" onSubmit={submit} className="space-y-4">
          {/* Name fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1.5">
                First Name
              </label>
              <input
                type="text"
                name="fname"
                required
                placeholder="Alex"
                className="w-full bg-zinc-50/70 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1.5">
                Last Name
              </label>
              <input
                type="text"
                name="lname"
                required
                placeholder="Chen"
                className="w-full bg-zinc-50/70 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
              />
            </div>
          </div>

          {/* Gender */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1.5">
              Gender
            </label>
            <select
              name="gender"
              required
              defaultValue="Other"
              className="w-full bg-zinc-50/70 border border-zinc-200 rounded-xl px-3.5 py-2.5 text-sm text-zinc-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Date of Birth / Year */}
          <DateOfBirthSelector
            value={dob}
            onChange={setDob}
            label="Date of Birth"
          />

          {/* Bio */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1.5">
              Bio
            </label>
            <textarea
              name="bio"
              rows={3}
              placeholder="What are your interests, skills or topics you love to discuss?"
              className="w-full bg-zinc-50/70 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all resize-none"
            />
          </div>

          {/* Submit */}
          <div className="pt-4 flex items-center gap-3">
            <Link
              href="/chat"
              className="w-1/3 py-3 px-4 rounded-xl border border-zinc-200 text-zinc-600 hover:bg-zinc-100 text-center text-sm font-medium transition-colors"
            >
              Skip
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="w-2/3 py-3 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-semibold transition-all shadow-sm hover:shadow active:scale-[0.99] flex items-center justify-center disabled:opacity-70"
            >
              {loading ? (
                <ThreeDots height={20} width={36} color="#ffffff" visible={true} />
              ) : (
                "Save & Enter Chats"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

