"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function NotificationRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/chat");
    setTimeout(() => {
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("switch-chat-tab", { detail: { tab: "notifications" } })
        );
      }
    }, 150);
  }, [router]);

  return null;
}
