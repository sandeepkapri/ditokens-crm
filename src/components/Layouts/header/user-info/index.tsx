"use client";

import { ChevronUpIcon } from "@/assets/icons";
import {
  Dropdown,
  DropdownContent,
  DropdownTrigger,
} from "@/components/ui/dropdown";
import { cn } from "@/lib/utils";
import { useSession, signOut } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { LogOutIcon, SettingsIcon, UserIcon } from "./icons";
import { getAvatarUrl } from "@/lib/utils/avatar";
import { isAdminUser, isSuperAdminUser } from "@/lib/admin-auth";

export function UserInfo() {
  const [isOpen, setIsOpen] = useState(false);
  const { data: session } = useSession();
  const pathname = usePathname();
  const [profilePicture, setProfilePicture] = useState<string>("");
  const [mounted, setMounted] = useState(false);

  // Check if user is admin/superadmin
  const isAdmin = isAdminUser(session);
  const isSuperAdmin = isSuperAdminUser(session);
  const isAdminRoute = pathname.startsWith("/admin");

  // Ensure client-side rendering
  useEffect(() => {
    setMounted(true);
  }, []);

  // Load user profile picture
  useEffect(() => {
    if (!mounted) return;
    
    const loadUserProfile = async () => {
      if (session?.user?.email) {
        try {
          const response = await fetch("/api/user/profile");
          if (response.ok) {
            const data = await response.json();
            setProfilePicture(getAvatarUrl(data.user.profilePicture));
          }
        } catch (error) {
          console.error("Failed to load user profile:", error);
          setProfilePicture(getAvatarUrl(null));
        }
      } else {
        setProfilePicture(getAvatarUrl(null));
      }
    };

    loadUserProfile();
  }, [session?.user?.email, mounted]);

  // Fallback user data if session is not available
  const USER = {
    name: session?.user?.name || "Guest User",
    email: session?.user?.email || "guest@ditokens.com",
    img: mounted ? (profilePicture || getAvatarUrl(null)) : getAvatarUrl(null),
  };

  const handleLogout = async () => {
    setIsOpen(false);
    await signOut({ 
      callbackUrl: "/auth/sign-in",
      redirect: true 
    });
  };

  return (
    <Dropdown isOpen={isOpen} setIsOpen={setIsOpen}>
      <DropdownTrigger className="rounded align-middle outline-none ring-primary ring-offset-2 focus-visible:ring-1 dark:ring-offset-gray-dark">
        <span className="sr-only">My Account</span>

        <figure className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-gray-200 dark:border-gray-600">
            <Image
              src={USER.img}
              className="w-full h-full object-cover"
              alt={`Avatar of ${USER.name}`}
              role="presentation"
              width={48}
              height={48}
            />
          </div>
          <figcaption className="flex items-center gap-1 font-medium text-dark dark:text-dark-6 max-[1024px]:sr-only">
            <span>{USER.name}</span>

            <ChevronUpIcon
              aria-hidden
              className={cn(
                "rotate-180 transition-transform",
                isOpen && "rotate-0",
              )}
              strokeWidth={1.5}
            />
          </figcaption>
        </figure>
      </DropdownTrigger>

      <DropdownContent
        className="border border-stroke bg-white shadow-md dark:border-dark-3 dark:bg-gray-dark min-[230px]:min-w-[17.5rem]"
        align="end"
      >
        <h2 className="sr-only">User information</h2>

        <figure className="flex items-center gap-2.5 px-5 py-3.5">
          <Image
            src={USER.img}
            className="size-12"
            alt={`Avatar for ${USER.name}`}
            role="presentation"
            width={200}
            height={200}
          />

          <figcaption className="space-y-1 text-base font-medium">
            <div className="mb-2 leading-none text-dark dark:text-white">
              {USER.name}
            </div>

            <div className="leading-none text-gray-6">{USER.email}</div>
          </figcaption>
        </figure>

        <hr className="border-[#E8E8E8] dark:border-dark-3" />

        {/* Admin Mode Toggle */}
        {(isAdmin || isSuperAdmin) && (
          <>
            <div className="p-2">
              {isAdminRoute ? (
                <Link
                  href="/dashboard"
                  onClick={() => setIsOpen(false)}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-[9px] bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800 dark:hover:bg-blue-900/30"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="mr-auto text-sm font-medium">Switch to User Mode</span>
                </Link>
              ) : (
                <Link
                  href="/admin/dashboard"
                  onClick={() => setIsOpen(false)}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-[9px] ${
                    isSuperAdmin 
                      ? "bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800 dark:hover:bg-purple-900/30"
                      : "bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800 dark:hover:bg-red-900/30"
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span className="mr-auto text-sm font-medium">
                    {isSuperAdmin ? "Super Admin Mode" : "Admin Mode"}
                  </span>
                </Link>
              )}
            </div>
            <hr className="border-[#E8E8E8] dark:border-dark-3" />
          </>
        )}

        <div className="p-2 text-base text-[#4B5563] dark:text-dark-6 [&>*]:cursor-pointer">
          <Link
            href={"/dashboard/profile"}
            onClick={() => setIsOpen(false)}
            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-[9px] hover:bg-gray-2 hover:text-dark dark:hover:bg-dark-3 dark:hover:text-white"
          >
            <UserIcon />

            <span className="mr-auto text-base font-medium">View profile</span>
          </Link>

          <Link
            href={"/dashboard/settings"}
            onClick={() => setIsOpen(false)}
            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-[9px] hover:bg-gray-2 hover:text-dark dark:hover:bg-dark-3 dark:hover:text-white"
          >
            <SettingsIcon />

            <span className="mr-auto text-base font-medium">
              Account Settings
            </span>
          </Link>
        </div>

        <hr className="border-[#E8E8E8] dark:border-dark-3" />

        <div className="p-2 text-base text-[#4B5563] dark:text-dark-6">
          <button
            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-[9px] hover:bg-gray-2 hover:text-dark dark:hover:bg-dark-3 dark:hover:text-white"
            onClick={handleLogout}
          >
            <LogOutIcon />

            <span className="text-base font-medium">Log out</span>
          </button>
        </div>
      </DropdownContent>
    </Dropdown>
  );
}
