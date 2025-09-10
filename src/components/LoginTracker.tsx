"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";

export default function LoginTracker() {
  const { data: session, status } = useSession();

  useEffect(() => {
    // Only track if user is authenticated and we haven't tracked this session yet
    if (status === "authenticated" && session?.user) {
      // Check if we've already tracked this session
      const sessionKey = `login_tracked_${session.user.email}`;
      const hasTracked = sessionStorage.getItem(sessionKey);
      
      if (!hasTracked) {
        // Track the login
        fetch("/api/auth/track-login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        })
        .then(response => {
          if (response.ok) {
            // Mark this session as tracked
            sessionStorage.setItem(sessionKey, "true");
            console.log("Login tracked successfully");
          }
        })
        .catch(error => {
          console.error("Failed to track login:", error);
        });
      }
    }
  }, [session, status]);

  return null; // This component doesn't render anything
}
