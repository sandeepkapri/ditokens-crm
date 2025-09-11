import { Session } from "next-auth";

export function isAdminUser(session: Session | null): boolean {
  if (!session?.user?.email) return false;
  return session.user.email === "admin@ditokens.com" || 
         session.user.email === "superadmin@ditokens.com" || 
         session.user.email === "contact@ditokens.com";
}

export function isSuperAdminUser(session: Session | null): boolean {
  if (!session?.user?.email) return false;
  return session.user.email === "superadmin@ditokens.com" || 
         session.user.email === "contact@ditokens.com";
}

export function isAdminRoute(pathname: string): boolean {
  return pathname.startsWith("/admin");
}
