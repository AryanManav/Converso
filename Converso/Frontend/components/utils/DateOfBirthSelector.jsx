"use client";

import React, { useEffect, useState } from "react";

export default function DateOfBirthSelector({ value = "", onChange, label = "Date of Birth" }) {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 95 }, (_, i) => currentYear - i); // 2026 down to 1932

  const months = [
    { value: "01", label: "January (01)" },
    { value: "02", label: "February (02)" },
    { value: "03", label: "March (03)" },
    { value: "04", label: "April (04)" },
    { value: "05", label: "May (05)" },
    { value: "06", label: "June (06)" },
    { value: "07", label: "July (07)" },
    { value: "08", label: "August (08)" },
    { value: "09", label: "September (09)" },
    { value: "10", label: "October (10)" },
    { value: "11", label: "November (11)" },
    { value: "12", label: "December (12)" },
  ];

  const [day, setDay] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");

  // Sync initial value if provided (e.g. "2002-05-14")
  useEffect(() => {
    if (value && typeof value === "string") {
      const parts = value.split("-");
      if (parts.length === 3) {
        setYear(parts[0]);
        setMonth(parts[1]);
        setDay(parts[2]);
      }
    }
  }, [value]);

  const handleUpdate = (newDay, newMonth, newYear) => {
    setDay(newDay);
    setMonth(newMonth);
    setYear(newYear);

    if (newYear && newMonth && newDay) {
      onChange(`${newYear}-${newMonth}-${newDay}`);
    } else if (!newYear && !newMonth && !newDay) {
      onChange("");
    }
  };

  // Determine number of days in selected month and year
  const getDaysInMonth = () => {
    if (!month) return 31;
    const y = parseInt(year) || 2024;
    const m = parseInt(month);
    return new Date(y, m, 0).getDate();
  };

  const daysCount = getDaysInMonth();
  const days = Array.from({ length: daysCount }, (_, i) => String(i + 1).padStart(2, "0"));

  return (
    <div>
      {label && (
        <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1.5">
          {label}
        </label>
      )}
      <div className="grid grid-cols-3 gap-2">
        {/* Month */}
        <select
          value={month}
          onChange={(e) => handleUpdate(day, e.target.value, year)}
          className="w-full bg-zinc-50/70 border border-zinc-200 rounded-xl px-2.5 py-2.5 text-sm text-zinc-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all cursor-pointer truncate"
        >
          <option value="">Month</option>
          {months.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>

        {/* Day */}
        <select
          value={day}
          onChange={(e) => handleUpdate(e.target.value, month, year)}
          className="w-full bg-zinc-50/70 border border-zinc-200 rounded-xl px-2.5 py-2.5 text-sm text-zinc-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all cursor-pointer"
        >
          <option value="">Day</option>
          {days.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>

        {/* Year */}
        <select
          value={year}
          onChange={(e) => handleUpdate(day, month, e.target.value)}
          className="w-full bg-zinc-50/70 border border-zinc-200 rounded-xl px-2.5 py-2.5 text-sm text-zinc-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all cursor-pointer font-medium"
        >
          <option value="">Year</option>
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center justify-between mt-1 text-[11px] text-zinc-400">
        <span>Quickly pick your birth year & date</span>
        {year && month && day && (
          <span className="text-primary-600 font-medium">{year}-{month}-{day}</span>
        )}
      </div>
    </div>
  );
}
