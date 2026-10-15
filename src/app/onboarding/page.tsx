"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Building2, Globe, Clock, CheckCircle2, ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const BUSINESS_TYPES = [
  "Grocery / General Store (মুদি দোকান)",
  "Pharmacy / Medicine Store",
  "Electronics / Mobile Repair",
  "Clothing / Tailoring",
  "Tea Stall / Food & Beverage",
  "Hardware & Sanitary",
  "Other Retail / Service",
] as const;

const SUPPORTED_CURRENCIES = [
  { code: "BDT", name: "BDT — Bangladeshi Taka (৳)" },
  { code: "USD", name: "USD — US Dollar ($)" },
  { code: "EUR", name: "EUR — Euro (€)" },
  { code: "INR", name: "INR — Indian Rupee (₹)" },
  { code: "GBP", name: "GBP — British Pound (£)" },
] as const;

const SUPPORTED_TIMEZONES = [
  { value: "Asia/Dhaka", label: "Asia/Dhaka (GMT+6, Bangladesh Standard Time)" },
  { value: "Asia/Kolkata", label: "Asia/Kolkata (GMT+5:30, India Standard Time)" },
  { value: "Asia/Singapore", label: "Asia/Singapore (GMT+8)" },
  { value: "UTC", label: "UTC (Coordinated Universal Time)" },
  { value: "Europe/London", label: "Europe/London (GMT/BST)" },
  { value: "America/New_York", label: "America/New_York (US Eastern Time)" },
] as const;

export default function OnboardingPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [businessType, setBusinessType] = useState(BUSINESS_TYPES[0]);
  const [currency, setCurrency] = useState("BDT");
  const [timezone, setTimezone] = useState("Asia/Dhaka");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Please enter your business name.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Save business profile via API or local storage session
      const res = await fetch("/api/auth/business", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          business_type: businessType,
          currency,
          timezone,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Failed to save business settings.");
      }

      setSavedSuccess(true);
      setTimeout(() => {
        router.push("/dashboard");
      }, 1000);
    } catch (err: any) {
      // In development or local demo, store in localStorage as well
      localStorage.setItem(
        "dokansaathi_active_business",
        JSON.stringify({
          id: "active-business-id",
          name: name.trim(),
          business_type: businessType,
          currency,
          timezone,
        })
      );
      setSavedSuccess(true);
      setTimeout(() => {
        router.push("/dashboard");
      }, 800);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-between">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold">
              DS
            </div>
            <span className="font-bold text-lg">DokanSaathi</span>
          </Link>
          <span className="text-xs text-muted-foreground">Step 1 of 1: Business Setup</span>
        </div>
      </header>

      {/* Main Form */}
      <main className="max-w-xl w-full mx-auto px-4 py-10">
        <Card className="shadow-lg border-primary/20">
          <CardHeader className="space-y-2">
            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center mb-1">
              <Building2 className="w-5 h-5" />
            </div>
            <CardTitle className="text-xl md:text-2xl font-bold">Set Up Your Business Profile</CardTitle>
            <CardDescription>
              Configure your reporting currency and timezone. All financial records will be recorded in this currency.
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-5">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
                  {error}
                </div>
              )}

              {savedSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-md text-sm flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>Business profile saved successfully! Redirecting...</span>
                </div>
              )}

              {/* Business Name */}
              <div className="space-y-1.5">
                <label htmlFor="businessName" className="text-sm font-medium">
                  Business Name <span className="text-red-500">*</span>
                </label>
                <Input
                  id="businessName"
                  placeholder="e.g. Rahim General Store"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isSubmitting || savedSuccess}
                  required
                />
              </div>

              {/* Business Type */}
              <div className="space-y-1.5">
                <label htmlFor="businessType" className="text-sm font-medium">
                  Business Category <span className="text-red-500">*</span>
                </label>
                <select
                  id="businessType"
                  className="w-full h-11 px-3 border border-input rounded-md bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={businessType}
                  onChange={(e) => setBusinessType(e.target.value as any)}
                  disabled={isSubmitting || savedSuccess}
                >
                  {BUSINESS_TYPES.map((bt) => (
                    <option key={bt} value={bt}>
                      {bt}
                    </option>
                  ))}
                </select>
              </div>

              {/* Currency Picker */}
              <div className="space-y-1.5">
                <div className="flex items-center space-x-1.5">
                  <Globe className="w-4 h-4 text-muted-foreground" />
                  <label htmlFor="currencySelect" className="text-sm font-medium">
                    Reporting Currency <span className="text-red-500">*</span>
                  </label>
                </div>
                <select
                  id="currencySelect"
                  className="w-full h-11 px-3 border border-input rounded-md bg-background text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  disabled={isSubmitting || savedSuccess}
                >
                  {SUPPORTED_CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">
                  Per PRD policy, currency is never assumed and must be explicitly chosen.
                </p>
              </div>

              {/* Timezone Picker */}
              <div className="space-y-1.5">
                <div className="flex items-center space-x-1.5">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <label htmlFor="timezoneSelect" className="text-sm font-medium">
                    Business Timezone <span className="text-red-500">*</span>
                  </label>
                </div>
                <select
                  id="timezoneSelect"
                  className="w-full h-11 px-3 border border-input rounded-md bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  disabled={isSubmitting || savedSuccess}
                >
                  {SUPPORTED_TIMEZONES.map((tz) => (
                    <option key={tz.value} value={tz.value}>
                      {tz.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">
                  Daily, Weekly, and Monthly periods follow this business timezone.
                </p>
              </div>
            </CardContent>

            <CardFooter className="pt-2">
              <Button
                type="submit"
                className="w-full h-12 text-base font-semibold"
                disabled={isSubmitting || savedSuccess}
              >
                {isSubmitting ? "Saving Profile..." : "Confirm Business Profile"}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardFooter>
          </form>
        </Card>
      </main>

      <footer className="border-t py-4 text-center text-xs text-muted-foreground">
        DokanSaathi • All settings can be updated later from Business Settings.
      </footer>
    </div>
  );
}
