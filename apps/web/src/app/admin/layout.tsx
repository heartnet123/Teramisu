import React from "react";
import { requireAdmin } from "@/lib/admin-guard";
import Link from "next/link";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Settings,
  LogOut,
  FolderTree,
  Ticket,
  BarChart3,
} from "lucide-react";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAdmin();

  const navigation = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { name: "Analytics", href: "/admin/analytics", icon: BarChart3 },
    { name: "Products", href: "/admin/products", icon: Package },
    { name: "Categories", href: "/admin/categories", icon: FolderTree },
    { name: "Orders", href: "/admin/orders", icon: ShoppingCart },
    { name: "Coupons", href: "/admin/coupons", icon: Ticket },
    { name: "Users", href: "/admin/users", icon: Users },
    { name: "Settings", href: "/admin/settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="flex">
        <aside className="w-64 min-h-screen bg-background border-r border-border">
          <div className="p-6 border-b border-border">
            <Link href="/admin" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary text-primary-foreground flex items-center justify-center rounded-lg text-sm font-bold">
                T
              </div>
              <div>
                <h1 className="font-semibold text-foreground">Teramisu Admin</h1>
                <p className="text-xs text-muted-foreground">Management Portal</p>
              </div>
            </Link>
          </div>

          <nav className="p-4 space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center gap-3 px-4 py-3 text-sm rounded-lg hover:bg-accent text-foreground transition-colors"
              >
                <item.icon size={18} />
                <span>{item.name}</span>
              </Link>
            ))}
          </nav>

          <div className="absolute bottom-0 w-64 p-4 border-t border-border bg-background">
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium">
                {session.user.name
                  ?.split(" ")
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {session.user.name}
                </p>
                <p className="text-xs text-muted-foreground truncate">Admin</p>
              </div>
              <form action="/api/auth/sign-out" method="POST">
                <button
                  type="submit"
                  className="p-2 hover:bg-accent rounded-lg transition-colors"
                >
                  <LogOut size={16} className="text-muted-foreground" />
                </button>
              </form>
            </div>
          </div>
        </aside>

        <main className="flex-1">
          <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
            <div className="px-8 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-foreground">Admin Dashboard</h2>
                <Link
                  href="/"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  ← Back to Store
                </Link>
              </div>
            </div>
          </div>
          <div className="p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}