"use client";

import Link from "next/link";
import * as React from "react";
import { Menu, Search, ShoppingCart } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { ModeToggle } from "./mode-toggle";

function getInitials(name?: string) {
  if (!name) return "U";
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function Navbar() {
  const { data: session, isPending } = authClient.useSession();

  return (
    <header className="border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between gap-4">
          {/* Left: Brand + primary nav */}
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary text-primary-foreground flex items-center justify-center rounded text-sm font-bold">E</div>
              <span className="hidden sm:inline font-light">Essence</span>
            </Link>

            <nav className="hidden md:flex gap-4 text-sm">
              <Link href="/" className="text-muted-foreground hover:text-foreground">Home</Link>
              <Link href="/shop" className="text-muted-foreground hover:text-foreground">Shop</Link>
              <Link href="/dashboard" className="text-muted-foreground hover:text-foreground">Dashboard</Link>
            </nav>
          </div>

          {/* Center: Search */}
          <div className="flex-1 max-w-2xl">
            <form action="/search" className="flex items-center gap-2">
              <Input name="q" placeholder="Search products, collections..." />
              <Button type="submit" variant="ghost" size="sm" className="-ml-10">
                <Search className="w-4 h-4" />
              </Button>
            </form>
          </div>

          {/* Right: actions + avatar */}
          <div className="flex items-center gap-3">
            <ModeToggle />

            <Link href="/cart">
              <Button variant="ghost" size="icon" aria-label="Cart">
                <ShoppingCart className="w-4 h-4" />
              </Button>
            </Link>

            {/* Auth state: show avatar image when available, otherwise sign in */}
            {isPending ? (
              <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-sm text-muted-foreground">…</div>
            ) : session && session.user ? (
              <Link href="/profile" className="inline-flex items-center">
                {session.user.image ? (
                  // Use plain img to avoid Next/Image SSR layout complexity in components
                  // `alt` uses user's name for accessibility
                  <img
                    src={session.user.image}
                    alt={session.user.name ?? "User avatar"}
                    className="w-9 h-9 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                    {getInitials(session.user.name)}
                  </div>
                )}
              </Link>
            ) : (
              <Link href="/login">
                <Button variant="outline" size="sm">Sign In</Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}