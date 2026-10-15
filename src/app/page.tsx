import Link from "next/link";
import { ArrowRight, PlusCircle, BookOpen, CheckCircle, BarChart3, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg shadow-sm">
              DS
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight">DokanSaathi</span>
              <span className="ml-2 text-xs font-medium px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full">
                SME Finance Copilot
              </span>
            </div>
          </div>

          <nav className="flex items-center space-x-2">
            <Link href="/onboarding">
              <Button variant="ghost" size="sm">
                Business Settings
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="sm">
                Sign In
              </Button>
            </Link>
            <Link href="/transactions/new">
              <Button size="sm" className="bg-primary text-primary-foreground">
                <PlusCircle className="w-4 h-4 mr-1.5" />
                Add Record
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 max-w-6xl w-full mx-auto px-4 py-8 space-y-8">
        {/* Welcome Banner */}
        <section className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-2xl p-6 md:p-8 shadow-md">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center space-x-2 bg-blue-800/60 px-3 py-1 rounded-full text-xs font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-300" />
              <span>English-First • Human Confirmed • Ledger Audited</span>
            </div>
            <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight">
              Maintain reliable shop finances in simple English
            </h1>
            <p className="text-blue-100 text-sm md:text-base leading-relaxed">
              Record sales, customer credit, supplier payables, and expenses by voice, text, or manual entry.
              Every AI draft requires your explicit confirmation before saving.
            </p>
            <div className="pt-2 flex flex-wrap gap-3">
              <Link href="/transactions/new">
                <Button size="lg" className="bg-white text-blue-900 hover:bg-blue-50 font-semibold shadow">
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Record New Transaction
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  View Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Feature Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center mb-2">
                <PlusCircle className="w-5 h-5" />
              </div>
              <CardTitle>Financial Entry & Confirmation</CardTitle>
              <CardDescription>
                Voice or text input with structured draft review. Nothing is saved until you confirm.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/transactions/new" className="text-sm font-medium text-primary flex items-center hover:underline">
                Open Entry Workflow <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center mb-2">
                <BookOpen className="w-5 h-5" />
              </div>
              <CardTitle>Business Ledger & Balances</CardTitle>
              <CardDescription>
                Track customer receivables, supplier payables, and paid expenses with exact audit history.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/transactions" className="text-sm font-medium text-primary flex items-center hover:underline">
                View Ledger Records <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center mb-2">
                <CheckCircle className="w-5 h-5" />
              </div>
              <CardTitle>Financing-Record Readiness</CardTitle>
              <CardDescription>
                Checklist of verified records and documents to prepare before speaking with a lender.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/readiness" className="text-sm font-medium text-primary flex items-center hover:underline">
                Check Readiness Status <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Financial Principles & Scope Note */}
        <section className="border rounded-xl p-5 bg-card text-muted-foreground text-xs space-y-2">
          <p className="font-semibold text-foreground text-sm">DokanSaathi Core Safeguards & Scope Policy</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Confirm Before Save:</strong> AI suggestions are strictly drafts. User confirmation is mandatory.</li>
            <li><strong>No Guesses:</strong> Missing amounts, parties, or splits trigger clarification questions.</li>
            <li><strong>Deterministic Arithmetic:</strong> Balances and totals are computed strictly in verified server-side code.</li>
            <li><strong>Excluded Scope:</strong> No 7-day cash flow forecasting, no stock/inventory deduction, and no loan approval predictions in the MVP.</li>
          </ul>
        </section>
      </div>

      {/* Footer */}
      <footer className="border-t py-6 text-center text-xs text-muted-foreground">
        <p>DokanSaathi — FinTechathon 2026 International Track (Topic E: SME Finance Copilot)</p>
      </footer>
    </main>
  );
}
