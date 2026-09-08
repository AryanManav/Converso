"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HelpRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/chat");
    setTimeout(() => {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("open-help-drawer"));
      }
    }, 150);
  }, [router]);

  return null;
}