import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@Teramisu/auth";

export async function requireAdmin() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "admin") {
    redirect("/");
  }

  return session;
}

export function isAdmin(role?: string | null): boolean {
  return role === "admin";
}
