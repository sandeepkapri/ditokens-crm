"use client";

import { SearchIcon } from "@/assets/icons";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useSidebarContext } from "../sidebar/sidebar-context";
import { MenuIcon } from "./icons";
import { Notification } from "./notification";
import { ThemeToggleSwitch } from "./theme-toggle";
import { UserInfo } from "./user-info";

export function Header() {
  const { toggleSidebar, isMobile } = useSidebarContext();
  const pathname = usePathname();
  const { data: session } = useSession();

  const isAdmin = session?.user?.email === "admin@ditokens.com";
  const isAdminRoute = pathname.startsWith("/admin");

  // Get page title based on current route
  const getPageTitle = () => {
    if (isAdminRoute) {
      if (pathname === "/admin/dashboard") return "Admin Dashboard";
      if (pathname === "/admin/users") return "User Management";
      if (pathname === "/admin/payments") return "Payment Management";
      if (pathname === "/admin/tokens") return "Token Management";
      if (pathname === "/admin/referrals") return "Referral Management";
      if (pathname === "/admin/staking") return "Staking Management";
      if (pathname === "/admin/history") return "Change History";
      return "Admin Panel";
    }
    
    if (pathname === "/dashboard") return "Dashboard";
    if (pathname.includes("/tokens")) return "Token Management";
    if (pathname.includes("/referrals")) return "Referrals";
    if (pathname.includes("/wallets")) return "Wallets";
    if (pathname.includes("/profile")) return "Profile";
    if (pathname.includes("/settings")) return "Settings";
    if (pathname.includes("/security")) return "Security";
    
    return "Dashboard";
  };

  const getPageDescription = () => {
    if (isAdminRoute) {
      return "Ditokens CRM - Administrative Control Panel";
    }
    return "Ditokens CRM - Token Management System";
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-stroke bg-white px-4 py-5 shadow-1 dark:border-stroke-dark dark:bg-gray-dark md:px-5 2xl:px-10">
      <button
        onClick={toggleSidebar}
        className="rounded-lg border px-1.5 py-1 dark:border-stroke-dark dark:bg-[#020D1A] hover:dark:bg-[#FFFFFF1A] lg:hidden"
      >
        <MenuIcon />
        <span className="sr-only">Toggle Sidebar</span>
      </button>

      {isMobile && (
        <Link href={isAdmin && isAdminRoute ? "/admin/dashboard" : "/dashboard"} className="ml-2 max-[430px]:hidden min-[375px]:ml-4">
          <Image
            src={"/images/logo/logo-icon.jpeg"}
            width={32}
            height={32}
            alt=""
            role="presentation"
          />
        </Link>
      )}

      <div className="max-xl:hidden">
        <div className="flex items-center gap-3">
          <h1 className="mb-0.5 text-heading-5 font-bold text-dark dark:text-white">
            {getPageTitle()}
          </h1>
          {isAdmin && isAdminRoute && (
            <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full dark:bg-red-900 dark:text-red-200">
              ADMIN
            </span>
          )}
        </div>
        <p className="font-medium">{getPageDescription()}</p>
      </div>

      <div className="flex flex-1 items-center justify-end gap-2 min-[375px]:gap-4">
        <div className="relative w-full max-w-[300px]">
          <input
            type="search"
            placeholder="Search"
            className="flex w-full items-center gap-3.5 rounded-full border bg-gray-2 py-3 pl-[53px] pr-5 outline-none transition-colors focus-visible:border-primary dark:border-dark-3 dark:bg-dark-2 dark:hover:border-dark-4 dark:hover:bg-dark-3 dark:hover:text-dark-6 dark:focus-visible:border-primary"
          />

          <SearchIcon className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 max-[1015px]:size-5" />
        </div>

        <ThemeToggleSwitch />

        <Notification />

        <div className="shrink-0">
          <UserInfo />
        </div>
      </div>
    </header>
  );
}
