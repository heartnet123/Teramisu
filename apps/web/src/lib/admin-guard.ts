import { headers } from "next/headers";
import { redirect } from "next/navigation";

const AUTH_URL = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3000";

export async function requireAdmin() {
  const headersList = await headers();
  const cookie = headersList.get("cookie") || "";

  try {
    // Forward cookies to Elysia backend to get session
    const response = await fetch(`${AUTH_URL}/api/auth/get-session`, {
      headers: {
        cookie,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      redirect("/login");
    }

    const session = await response.json();

    if (!session?.user) {
      redirect("/login");
    }

    if (session.user.role !== "admin") {
      redirect("/");
    }

    return session;
  } catch (error) {
    console.error("Auth check failed:", error);
    redirect("/login");
  }
}

export function isAdmin(role?: string | null): boolean {
  return role === "admin";
}
