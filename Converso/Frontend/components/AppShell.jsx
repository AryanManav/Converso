"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

const publicPaths = ["/", "/register", "/login", "/register/setprofile"];

export default function AppShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(true);

  useEffect(() => {
    // If navigating to any protected route
    if (!publicPaths.includes(pathname)) {
      const username = localStorage.getItem("username");
      const password = localStorage.getItem("password");
      if (!username || !password) {
        setIsAuthenticated(false);
        router.replace("/login");
        return;
      }
    }
    setIsAuthenticated(true);
  }, [pathname, router]);

  // Prevent flash of protected UI if user is unauthenticated
  if (!publicPaths.includes(pathname) && !isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen flex bg-zinc-50 text-zinc-900">
      <main className="flex-1 min-w-0 min-h-screen">
        {children}
      </main>
    </div>
  );
}
