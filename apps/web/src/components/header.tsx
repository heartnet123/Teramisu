"use client";
import Link from "next/link";
import { ModeToggle } from "./mode-toggle";
import UserMenu from "./user-menu";
import IconCart from "./icons/cart";
import { useCartStore } from "../service/store";
import { MobileMenu } from "./mobile-menu";

export default function Header() {
  const links = [
    // { to: "/", label: "Home" },
    { to: "/shop", label: "Shop" },
  ] as const;

  const count = useCartStore((s) => s.itemCount());

  return (
    <header className="fixed top-0 w-full z-50 border-b border-border bg-background/95 backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <MobileMenu />
          <a href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary text-primary-foreground flex items-center justify-center rounded-lg text-sm font-bold">T</div>
            <span className="font-semibold tracking-tighter text-foreground">Teramisu</span>
          </a>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            {links.map((l, i) => (
              <a
                key={l.to}
                href={l.to}
                className={`tab`}
                style={{ animationDelay: `${i * 60}ms` }}
              >
                {l.label}
              </a>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <button aria-label="Search" className="glass-button p-2" title="Search">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
  
          <Link href="/cart" aria-label="Cart" title="Cart" className="glass-button p-2 relative">
            <IconCart className="w-5 h-5" />
            {count > 0 ? (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-5 flex items-center justify-center px-1 text-xs bg-accent text-accent-foreground rounded-full border-2 border-background">
                {count}
              </span>
            ) : null}
          </Link>
  
          <ModeToggle />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}