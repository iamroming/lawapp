"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Scale, Menu, X } from "lucide-react";
import { getFirebaseAuth } from "@/lib/firebase/config";
import { onAuthStateChanged } from "firebase/auth";

const navLinks = [
  { href: "/#features", label: "Product" },
  { href: "/#solution", label: "Solutions" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/blog", label: "Blog" },
  { href: "/#testimonials", label: "Testimonials" },
];

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    try {
      const auth = getFirebaseAuth();
      const unsub = onAuthStateChanged(auth, (user) => {
        setLoggedIn(!!user);
        setChecking(false);
      });
      return unsub;
    } catch {
      setChecking(false);
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      {/* Navbar - matches landing page */}
      <nav className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2">
              <Scale className="h-7 w-7 text-orange-500" />
              <span className="text-xl font-bold">CaseFiles</span>
            </Link>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-gray-400">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="hover:text-white transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-3">
            {checking ? (
              <div className="h-8 w-20 bg-white/10 rounded animate-pulse" />
            ) : loggedIn ? (
              <Link
                href="/dashboard"
                className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors"
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link href="/login" className="text-sm text-gray-400 hover:text-white transition-colors hidden sm:block">
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
                >
                  Try Free
                </Link>
              </>
            )}
            <button
              className="md:hidden text-white p-1"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
        {mobileOpen && (
          <div className="md:hidden border-t border-white/10 bg-black/95 px-4 py-4 space-y-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block text-gray-400 hover:text-white text-sm"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </nav>

      {/* Main content */}
      <main className="flex-1">{children}</main>

      {/* Footer - matches landing page */}
      <footer className="border-t border-white/10 pt-16 pb-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
            <div className="lg:col-span-2">
              <Link href="/" className="flex items-center gap-2 mb-4">
                <Scale className="h-6 w-6 text-orange-500" />
                <span className="text-lg font-bold">CaseFiles</span>
              </Link>
              <p className="text-sm text-gray-500 leading-relaxed max-w-xs">
                The all-in-one practice management software for Indian lawyers. Manage cases, clients, billing, and court dates from one platform.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li><Link href="/#features" className="hover:text-white transition-colors">Features</Link></li>
                <li><Link href="/#pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                <li><Link href="/blog" className="hover:text-white transition-colors">Blog</Link></li>
                <li><Link href="/help" className="hover:text-white transition-colors">Help Center</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-4">Solutions</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li><Link href="/#solution" className="hover:text-white transition-colors">Solo Practice</Link></li>
                <li><Link href="/#solution" className="hover:text-white transition-colors">Small Firms</Link></li>
                <li><Link href="/#solution" className="hover:text-white transition-colors">Enterprise</Link></li>
                <li><Link href="/#solution" className="hover:text-white transition-colors">Litigation Teams</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-600">
              &copy; {new Date().getFullYear()} CaseFiles. All rights reserved.
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
              <Link href="/help" className="hover:text-white transition-colors">Support</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
