import { redirect } from "next/navigation";
import { isOwner } from "@/lib/auth";

// Proxy already redirects anonymous visitors; this is the authoritative check.
export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  if (!(await isOwner())) redirect("/signin");
  return children;
}
