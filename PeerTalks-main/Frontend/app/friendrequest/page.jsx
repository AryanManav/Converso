"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function FriendRequestRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/chat");
    setTimeout(() => {
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("switch-chat-tab", { detail: { tab: "requests" } })
        );
      }
    }, 150);
  }, [router]);

  return null;
}
