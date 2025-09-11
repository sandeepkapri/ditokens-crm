"use client";

import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { getNavData } from "./data";
import { getAdminNavData } from "./data/admin-nav";
import { ArrowLeftIcon, ChevronUp } from "./icons";

import { useSidebarContext } from "./sidebar-context";
import { isAdminUser, isSuperAdminUser } from "@/lib/admin-auth";

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { setIsOpen, isOpen, isMobile, toggleSidebar } = useSidebarContext();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  // Determine which navigation data to use
  const isAdmin = isAdminUser(session);
  const isSuperAdmin = isSuperAdminUser(session);
  const isAdminRoute = pathname.startsWith("/admin");
  const navData = isAdminRoute ? getAdminNavData(isSuperAdmin) : getNavData(isAdmin || isSuperAdmin);

  const toggleExpanded = (title: string) => {
    setExpandedItems((prev) => {
      if (prev.includes(title)) {
        return [];
      } else {
        return [title];
      }
    });
  };

  const closeAllSubmenus = () => {
    setExpandedItems([]);
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 transition-opacity duration-300"
          onClick={() => {
            setIsOpen(false);
            closeAllSubmenus(); // Close submenus when clicking overlay
          }}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "max-w-[290px] overflow-hidden border-r border-gray-200 bg-white transition-[width] duration-200 ease-linear dark:border-gray-800 dark:bg-gray-dark",
          isMobile ? "fixed bottom-0 top-0 z-50" : "sticky top-0 h-screen",
          isOpen ? "w-full" : "w-0",
        )}
        aria-label="Main navigation"
        aria-hidden={!isOpen}
        inert={!isOpen}
      >
        <div className="flex h-full flex-col py-8 pl-[20px] pr-[5px]">
          <div className="relative pr-4">
            <Link
              href={(isAdmin || isSuperAdmin) && isAdminRoute ? "/admin/dashboard" : "/dashboard"}
              onClick={() => {
                if (isMobile) {
                  toggleSidebar();
                  closeAllSubmenus(); // Close submenus when navigating
                }
              }}
              className="px-0 py-2 min-[850px]:py-0"
            >
              <Logo />
            </Link>

            {isMobile && (
              <button
                onClick={() => {
                  toggleSidebar();
                  closeAllSubmenus(); // Close submenus when closing sidebar
                }}
                className="absolute left-3/4 right-4 top-1/2 -translate-y-1/2 text-right"
              >
                <span className="sr-only">Close Menu</span>

                <ArrowLeftIcon className="ml-auto size-6" />
              </button>
            )}
          </div>

          {/* Admin Badge */}
          {(isAdmin || isSuperAdmin) && isAdminRoute && (
            <div className={`mt-3 px-2 py-1.5 rounded-lg border ${
              isSuperAdmin 
                ? "bg-purple-100 dark:bg-purple-900 border-purple-200 dark:border-purple-800" 
                : "bg-red-100 dark:bg-red-900 border-red-200 dark:border-red-800"
            }`}>
              <div className="flex items-center space-x-1.5">
                <div className={`w-1.5 h-1.5 rounded-full ${
                  isSuperAdmin ? "bg-purple-500" : "bg-red-500"
                }`}></div>
                <span className={`text-xs font-medium ${
                  isSuperAdmin 
                    ? "text-purple-700 dark:text-purple-300" 
                    : "text-red-700 dark:text-red-300"
                }`}>
                  {isSuperAdmin ? "SUPER ADMIN MODE" : "ADMIN MODE"}
                </span>
              </div>
            </div>
          )}



          {/* Navigation */}
          <div className="custom-scrollbar mt-4 flex-1 overflow-y-auto pr-2 min-[850px]:mt-8">
            {navData.map((section) => (
              <div key={section.label} className="mb-4">
                <h2 className="mb-3 text-xs font-medium text-dark-4 dark:text-dark-6 uppercase tracking-wider">
                  {section.label}
                </h2>

                <nav role="navigation" aria-label={section.label}>
                  <ul className="space-y-1">
                    {section.items.map((item) => (
                      <li key={item.title}>
                        {item.items.length ? (
                          <div>
                            <button
                              className={cn(
                                "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                                item.items.some(({ url }) => url === pathname)
                                  ? "bg-[rgba(87,80,241,0.07)] text-primary dark:bg-[#FFFFFF1A] dark:text-white"
                                  : "text-dark-4 hover:bg-gray-100 hover:text-dark dark:text-dark-6 hover:dark:bg-[#FFFFFF1A] hover:dark:text-white"
                              )}
                              onClick={() => toggleExpanded(item.title)}
                            >
                              <item.icon
                                className="size-5 shrink-0"
                                aria-hidden="true"
                              />

                              <span className="text-sm">{item.title}</span>

                              <ChevronUp
                                className={cn(
                                  "ml-auto rotate-180 transition-transform duration-200",
                                  expandedItems.includes(item.title) &&
                                    "rotate-0",
                                )}
                                aria-hidden="true"
                              />
                            </button>

                            {expandedItems.includes(item.title) && (
                              <ul
                                className="ml-7 mr-0 space-y-1 pb-[12px] pr-0 pt-1.5"
                                role="menu"
                              >
                                {item.items.map((subItem) => (
                                  <li key={subItem.title} role="none">
                                    <Link
                                      href={subItem.url}
                                      className={cn(
                                        "relative block rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200",
                                        pathname === subItem.url
                                          ? "bg-[rgba(87,80,241,0.07)] text-primary dark:bg-[#FFFFFF1A] dark:text-white"
                                          : "text-dark-4 hover:bg-gray-100 hover:text-dark dark:text-dark-6 hover:dark:bg-[#FFFFFF1A] hover:dark:text-white"
                                      )}
                                    >
                                      {subItem.title}
                                    </Link>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        ) : (
                          (() => {
                            const href =
                              "url" in item
                                ? item.url + ""
                                : "/" +
                                  item.title.toLowerCase().split(" ").join("-");

                            return (
                              <Link
                                href={href}
                                className={cn(
                                  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                                  pathname === href
                                    ? "bg-[rgba(87,80,241,0.07)] text-primary dark:bg-[#FFFFFF1A] dark:text-white"
                                    : "text-dark-4 hover:bg-gray-100 hover:text-dark dark:text-dark-6 hover:dark:bg-[#FFFFFF1A] hover:dark:text-white"
                                )}
                              >
                                <item.icon
                                  className="size-5 shrink-0"
                                  aria-hidden="true"
                                />

                                <span className="text-sm">{item.title}</span>
                              </Link>
                            );
                          })()
                        )}
                      </li>
                    ))}
                  </ul>
                </nav>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </>
  );
}
