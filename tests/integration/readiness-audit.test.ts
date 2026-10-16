import { describe, it, expect } from "vitest";
import { GET as getReadiness } from "../../src/app/api/readiness/route";
import { NextRequest } from "next/server";

describe("Financing Record Readiness Checklist (Task 8)", () => {
  it("returns exactly 6 approved categories with transparent provenance", async () => {
    const req = new NextRequest("http://localhost:3000/api/readiness");
    const res = await getReadiness(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.items).toHaveLength(6);
    expect(data.total_count).toBe(6);

    const categories = data.items.map((i: any) => i.id);
    expect(categories).toEqual([
      "readiness-identity-registration",
      "readiness-bank-account",
      "readiness-sales-history",
      "readiness-receivables-tracking",
      "readiness-supplier-payables",
      "readiness-operating-expenses",
    ]);

    // Check evidence sources: Items 1 and 2 must be User-reported; Items 3 to 6 must be Application record-derived
    expect(data.items[0].source_provenance).toBe("User-reported");
    expect(data.items[1].source_provenance).toBe("User-reported");
    expect(data.items[2].source_provenance).toBe("Application record-derived");
    expect(data.items[3].source_provenance).toBe("Application record-derived");
    expect(data.items[4].source_provenance).toBe("Application record-derived");
    expect(data.items[5].source_provenance).toBe("Application record-derived");
  });

  it("includes the exact mandatory statutory financing disclaimer", async () => {
    const req = new NextRequest("http://localhost:3000/api/readiness");
    const res = await getReadiness(req);
    const data = await res.json();

    expect(data.disclaimer).toContain(
      "This checklist helps you prepare your business records. DokanSaathi does not approve loans or guarantee financing. Final decisions are made by financial institutions."
    );
  });

  it("calculates completion count and percentage dynamically from documented items", async () => {
    const req = new NextRequest("http://localhost:3000/api/readiness");
    const res = await getReadiness(req);
    const data = await res.json();

    const documentedCount = data.items.filter((i: any) => i.status === "documented").length;
    expect(data.completed_count).toBe(documentedCount);
    expect(data.readiness_percentage).toBe(Math.round((documentedCount / 6) * 100));
  });

  it("does not infer bank account from configured business currency", async () => {
    const req = new NextRequest("http://localhost:3000/api/readiness");
    const res = await getReadiness(req);
    const data = await res.json();

    const bankItem = data.items.find((i: any) => i.id === "readiness-bank-account");
    expect(bankItem.evidence).not.toContain("Business currency configured");
    expect(bankItem.status).not.toBe("documented");
  });
});
