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
  ExternalLink,
  Info,
  RefreshCw,
  Sparkles
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

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Financing Record Readiness
            </h1>
            <Badge variant="outline" className="text-xs">
              SME Preparation Guide
            </Badge>
          </div>
          <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
            Organize verified financial records and documentation before approaching formal lenders.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchReadiness}
          disabled={isLoading}
          className="h-9 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? "animate-spin" : ""}`} />
          Refresh Status
        </Button>
      </div>

      {/* Mandatory Statutory Disclaimer Alert Banner */}
      <div className="p-4 bg-amber-50/80 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-700/50 rounded-xl space-y-2 text-amber-900 dark:text-amber-200">
        <div className="flex items-center space-x-2 font-bold text-xs uppercase tracking-wider text-amber-800 dark:text-amber-300">
          <ShieldAlert className="w-4 h-4 flex-shrink-0" />
          <span>Important Regulatory & Scope Disclaimer</span>
        </div>
        <p className="text-xs leading-relaxed">
          {disclaimer ||
            "This readiness checklist is an organizational guide to help small businesses prepare their financial records. It does not predict, promise, or guarantee loan approval, credit scoring, or financing eligibility from any bank or financial institution. Lending criteria and approvals are determined solely by authorized financial institutions under their independent credit policies."}
        </p>
      </div>

      {/* Progress Summary Card */}
      <div className="p-5 bg-card rounded-xl border shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-muted-foreground block">
              Documentation Readiness
            </span>
            <span className="text-xl md:text-2xl font-extrabold text-foreground">
              {completedCount} of {items.length} Items Documented ({percentage}%)
            </span>
          </div>
          <Link href="/transactions/new">
            <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium">
              Record Transaction
            </Button>
          </Link>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
          <div
            className="bg-emerald-600 h-2.5 rounded-full transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="p-12 text-center space-y-3">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="text-sm font-medium text-foreground">Evaluating financial record readiness...</p>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Checklist Items */}
      {!isLoading && !error && (
        <div className="space-y-3">
          {items.map((item) => (
            <Card key={item.id} className="border shadow-xs hover:border-primary/40 transition-colors">
              <CardHeader className="p-4 pb-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs uppercase font-bold tracking-wider text-muted-foreground">
                        {item.category.replace("_", " ")}
                      </span>
                      {item.status === "ready" ? (
                        <Badge variant="outline" className="text-emerald-700 border-emerald-300 text-[10px]">
                          <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
                          Documented
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-amber-700 border-amber-300 text-[10px]">
                          <Clock className="w-3 h-3 mr-1 text-amber-600" />
                          Needs Attention
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-base font-bold text-foreground">
                      {item.title}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {item.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-4 pt-2 space-y-2">
                <div className="p-2.5 rounded-lg bg-muted/30 border text-xs space-y-1">
                  <div className="flex items-start gap-1.5">
                    <span className="font-semibold text-foreground whitespace-nowrap">Current Evidence:</span>
                    <span className="text-muted-foreground">{item.evidence}</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <span className="font-semibold text-foreground whitespace-nowrap">Recommended Action:</span>
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
