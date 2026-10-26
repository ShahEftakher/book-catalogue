// Optimistic gate for /admin: redirects to /signin when there is no owner session.
// Pages and server actions still call requireOwner() themselves.
export { auth as proxy } from "@/lib/auth";

export const config = {
  matcher: ["/admin/:path*"],
};
