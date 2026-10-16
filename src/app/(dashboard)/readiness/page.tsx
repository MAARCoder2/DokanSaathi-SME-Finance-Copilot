"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  FileCheck2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldAlert,
  ArrowRight,
  Info,
  RefreshCw,
  FileText,
  Building,
  UserCheck,
  CreditCard,
  Receipt,
  HelpCircle,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ReadinessItem } from "@/app/api/readiness/route";

export default function ReadinessPage() {
  const [items, setItems] = useState<ReadinessItem[]>([]);
  const [completedCount, setCompletedCount] = useState(0);
  const [percentage, setPercentage] = useState(0);
  const [disclaimer, setDisclaimer] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReadiness = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/readiness");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load readiness checklist.");

      setItems(data.items || []);
      setCompletedCount(data.completed_count || 0);
      setPercentage(data.readiness_percentage || 0);
      setDisclaimer(data.disclaimer || "");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error loading readiness data.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReadiness();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "documented":
        return (
          <Badge variant="outline" className="text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/30 text-xs font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600 dark:text-emerald-400" />
            Documented
          </Badge>
        );
      case "unverified":
        return (
          <Badge variant="outline" className="text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 text-xs font-semibold">
            <HelpCircle className="w-3.5 h-3.5 mr-1 text-slate-500" />
            Unverified
          </Badge>
        );
      case "needs_attention":
      default:
        return (
          <Badge variant="outline" className="text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/30 text-xs font-semibold">
            <Clock className="w-3.5 h-3.5 mr-1 text-amber-600 dark:text-amber-400" />
            Needs Attention
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Financing Record Readiness
            </h1>
            <Badge variant="outline" className="text-xs font-semibold">
              SME Preparation Audit
            </Badge>
          </div>
          <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
            Evidence-based audit of your business records for formal institutional financing.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchReadiness}
          disabled={isLoading}
          className="h-10 px-3 self-start sm:self-auto font-medium"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? "animate-spin" : ""}`} />
          Refresh Status
        </Button>
      </div>

      {/* Mandatory Statutory Financing Disclaimer Banner */}
      <div className="p-4 sm:p-5 bg-amber-50/90 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 rounded-2xl space-y-2 text-amber-950 dark:text-amber-200 shadow-xs">
        <div className="flex items-center space-x-2 font-bold text-xs uppercase tracking-wider text-amber-900 dark:text-amber-300">
          <ShieldAlert className="w-4 h-4 flex-shrink-0 text-amber-600 dark:text-amber-400" />
          <span>Statutory Regulatory & Scope Disclaimer</span>
        </div>
        <p className="text-xs leading-relaxed text-amber-900 dark:text-amber-200 font-medium">
          {disclaimer ||
            "This checklist helps you prepare your business records. DokanSaathi does not approve loans or guarantee financing. Final decisions are made by financial institutions."}
        </p>
      </div>

      {/* Progress Summary Card */}
      <div className="p-5 sm:p-6 bg-card rounded-2xl border shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
              Audit Progress
            </span>
            <span className="text-xl sm:text-2xl font-black text-foreground">
              {completedCount} of {items.length} Categories Documented ({percentage}%)
            </span>
            <p className="text-xs text-muted-foreground mt-0.5">
              Based entirely on verified application records and self-reported documentation.
            </p>
          </div>
          <Link href="/transactions/new">
            <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-4 h-10 w-full sm:w-auto">
              Record New Entry
            </Button>
          </Link>
        </div>

        {/* Dynamic Progress Bar */}
        <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
          <div
            className="bg-emerald-600 h-3 rounded-full transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="p-12 text-center space-y-3 bg-card rounded-2xl border">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="text-sm font-semibold text-foreground">Evaluating financial record readiness...</p>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 text-red-700 dark:text-red-300 rounded-xl text-xs md:text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Checklist Items: Exactly 6 Categories */}
      {!isLoading && !error && (
        <div className="space-y-3.5">
          {items.map((item) => (
            <Card key={item.id} className="border shadow-xs hover:border-primary/40 transition-colors">
              <CardHeader className="p-4 sm:p-5 pb-2">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] uppercase font-bold tracking-wider text-muted-foreground">
                        {item.category}
                      </span>
                      <Badge
                        variant="secondary"
                        className={`text-[10px] py-0 px-2 font-medium ${
                          item.source_provenance === "Application record-derived"
                            ? "bg-sky-500/10 text-sky-800 dark:text-sky-300 border-sky-500/20"
                            : "bg-purple-500/10 text-purple-800 dark:text-purple-300 border-purple-500/20"
                        }`}
                      >
                        {item.source_provenance}
                      </Badge>
                      {getStatusBadge(item.status)}
                    </div>
                    <CardTitle className="text-base font-bold text-foreground pt-0.5">
                      {item.title}
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground">
                      {item.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-4 sm:p-5 pt-2 space-y-2">
                <div className="p-3 rounded-xl bg-muted/40 border border-border/60 text-xs space-y-1.5">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-1">
                    <span className="font-semibold text-foreground whitespace-nowrap min-w-32">
                      Audit Evidence:
                    </span>
                    <span className="text-muted-foreground">{item.evidence}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-start gap-1 pt-1 border-t border-border/40">
                    <span className="font-semibold text-foreground whitespace-nowrap min-w-32">
                      Recommended Action:
                    </span>
                    <span className="text-muted-foreground">{item.recommendation}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
