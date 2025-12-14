import Link from "next/link"
import { Mail, Instagram, Twitter } from "lucide-react"

export default function Footer() {
  return (
    <footer className="border-t border-stone-200/50 dark:border-stone-800/50 py-16 px-6">
      <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-8 mb-12">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 bg-stone-900 dark:bg-white text-white dark:text-stone-900 flex items-center justify-center rounded text-xs font-bold">
              T
            </div>
            <span className="font-light">Teramisu</span>
          </div>
          <p className="text-xs text-muted-foreground font-light">
            Carefully curated essentials for the discerning taste.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-light mb-4">Shop</h3>
          <ul className="space-y-2">
            <li>
              <Link
                href="/shop"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors font-light"
              >
                All Products
              </Link>
            </li>
            <li>
              <Link
                href="/collections"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors font-light"
              >
                Collections
              </Link>
            </li>
            <li>
              <Link
                href="/new"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors font-light"
              >
                New Arrivals
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-light mb-4">Company</h3>
          <ul className="space-y-2">
            <li>
              <Link
                href="/about"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors font-light"
              >
                About
              </Link>
            </li>
            <li>
              <Link
                href="/blog"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors font-light"
              >
                Journal
              </Link>
            </li>
            <li>
              <Link
                href="/contact"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors font-light"
              >
                Contact
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-light mb-4">Connect</h3>
          <ul className="space-y-2 flex items-center gap-4">
            <li>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                <Instagram className="w-4 h-4" />
              </a>
            </li>
            <li>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                <Twitter className="w-4 h-4" />
              </a>
            </li>
            <li>
              <a
                href="mailto:hello@essence.com"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Mail className="w-4 h-4" />
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-stone-200/50 dark:border-stone-800/50 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
        <p className="text-xs text-muted-foreground font-light">© 2025 Teramisu. All rights reserved.</p>
        <div className="flex gap-6">
          <Link
            href="/privacy"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors font-light"
          >
            Privacy
          </Link>
          <Link
            href="/terms"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors font-light"
          >
            Terms
          </Link>
        </div>
      </div>
    </footer>
  )
}
