"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Receipt,
  PlusCircle,
  FileCheck2,
  Store,
  LogOut,
  Menu,
  X
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FloatingActions } from "@/components/FloatingActions";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Ledger", href: "/transactions", icon: Receipt },
    { label: "New Entry", href: "/transactions/new", icon: PlusCircle },
    { label: "Readiness", href: "/readiness", icon: FileCheck2 },
  ];

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col">
      {/* Top Header */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <div className="w-9 h-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-black text-lg shadow-sm">
                DS
              </div>
              <div>
                <span className="font-extrabold text-base md:text-lg tracking-tight block">
                  DokanSaathi
                </span>
                <span className="text-[10px] text-muted-foreground hidden sm:block">
                  SME Finance Copilot
                </span>
              </div>
            </Link>
            <Badge variant="outline" className="hidden sm:inline-flex text-[11px] font-semibold border-primary/30 text-primary">
              BDT (৳)
            </Badge>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Header Actions */}
          <div className="flex items-center space-x-2">
            <Link href="/transactions/new" className="hidden sm:block">
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium h-9">
                <PlusCircle className="w-4 h-4 mr-1.5" />
                <span>Record Entry</span>
              </Button>
            </Link>

            <Link href="/login" className="hidden md:block">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive">
                <LogOut className="w-4 h-4" />
                <span className="sr-only">Sign out</span>
              </Button>
            </Link>

            {/* Mobile menu toggle */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b bg-background px-4 pt-2 pb-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center space-x-2.5 px-3 py-2.5 rounded-lg text-sm font-medium ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
            <div className="pt-2 border-t mt-2">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center space-x-2.5 px-3 py-2 text-sm text-destructive hover:bg-red-50 rounded-lg"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-5xl pb-28 md:pb-12">
        {children}
      </main>

      {/* Global Floating Action Buttons (Safe-area positioned) */}
      <FloatingActions />

      {/* Mobile Bottom Fixed Navigation Bar (320px+ compliant) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur border-t px-2 py-1.5 flex items-center justify-around shadow-lg">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1 px-2 min-w-[64px] min-h-[44px] rounded-md transition-colors ${
                isActive ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] mt-0.5">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
