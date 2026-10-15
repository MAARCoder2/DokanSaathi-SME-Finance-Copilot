"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, Mail, ArrowRight, Shield } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) {
        throw new Error(signUpError.message);
      }

      // Successful registration proceeds to onboarding
      router.push("/onboarding");
    } catch (err: any) {
      // In local offline development without live Supabase, redirect to onboarding directly
      if (err.message.includes("fetch failed") || err.message.includes("placeholder")) {
        router.push("/onboarding");
        return;
      }
      setError(err.message || "Failed to create account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center px-4 py-12">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center space-x-2">
            <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">
              DS
            </div>
            <span className="font-extrabold text-2xl tracking-tight">DokanSaathi</span>
          </Link>
          <p className="text-sm text-muted-foreground">Register your new small business account</p>
        </div>

        <Card className="shadow-lg border-primary/20">
          <CardHeader>
            <CardTitle className="text-xl">Create Account</CardTitle>
            <CardDescription>Get started with an English-first finance copilot for your shop</CardDescription>
          </CardHeader>

          <form onSubmit={handleRegister}>
            <CardContent className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-sm font-medium flex items-center space-x-1.5" htmlFor="regEmail">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span>Email Address</span>
                </label>
                <Input
                  id="regEmail"
                  type="email"
                  placeholder="shopkeeper@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium flex items-center space-x-1.5" htmlFor="regPass">
                  <Lock className="w-4 h-4 text-muted-foreground" />
                  <span>Password</span>
                </label>
                <Input
                  id="regPass"
                  type="password"
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium flex items-center space-x-1.5" htmlFor="regConfirm">
                  <Lock className="w-4 h-4 text-muted-foreground" />
                  <span>Confirm Password</span>
                </label>
                <Input
                  id="regConfirm"
                  type="password"
                  placeholder="Re-type password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-3 pt-2">
              <Button type="submit" className="w-full h-11" disabled={loading}>
                {loading ? "Creating Account..." : "Create Account & Continue"}
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>

              <div className="text-center text-xs text-muted-foreground">
                Already have an account?{" "}
                <Link href="/login" className="text-primary font-medium hover:underline">
                  Sign In
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>

        <div className="flex items-center justify-center space-x-1.5 text-xs text-muted-foreground">
          <Shield className="w-3.5 h-3.5 text-emerald-600" />
          <span>English-only MVP • Private and isolated business records</span>
        </div>
      </div>
    </div>
  );
}
