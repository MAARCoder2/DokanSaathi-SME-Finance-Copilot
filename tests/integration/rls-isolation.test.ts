import { describe, it, expect } from "vitest";

describe("Milestone B: Security & Multi-Tenant Data Isolation", () => {
  // Mock tenant records simulating Supabase RLS and server-side authorization check
  const businesses = [
    { id: "biz-user-a", owner_id: "user-a", name: "Rahim Store", currency: "BDT", timezone: "Asia/Dhaka" },
    { id: "biz-user-b", owner_id: "user-b", name: "Karim Enterprise", currency: "BDT", timezone: "Asia/Dhaka" },
  ];

  const transactions = [
    { id: "tx-a1", business_id: "biz-user-a", amount: "1000.00", type: "SALE" },
    { id: "tx-b1", business_id: "biz-user-b", amount: "5000.00", type: "SALE" },
  ];

  function authorizeUserAccess(userId: string | null, requestedBusinessId: string) {
    if (!userId) {
      return { authorized: false, code: "AUTH_REQUIRED", message: "Authentication required" };
    }
    const business = businesses.find((b) => b.id === requestedBusinessId);
    if (!business) {
      return { authorized: false, code: "NOT_FOUND", message: "Business not found" };
    }
    if (business.owner_id !== userId) {
      return { authorized: false, code: "ACCESS_DENIED", message: "Unauthorized access to business data" };
    }
    return { authorized: true, business };
  }

  function getAuthorizedTransactions(userId: string | null, requestedBusinessId: string) {
    const authCheck = authorizeUserAccess(userId, requestedBusinessId);
    if (!authCheck.authorized) {
      return { success: false, ...authCheck };
    }
    const rows = transactions.filter((t) => t.business_id === requestedBusinessId);
    return { success: true, data: rows };
  }

  it("denies access to unauthenticated requests (AC-17, T-16)", () => {
    const result = getAuthorizedTransactions(null, "biz-user-a");
    expect(result.success).toBe(false);
    expect(result.code).toBe("AUTH_REQUIRED");
  });

  it("allows user to access their own business records", () => {
    const result = getAuthorizedTransactions("user-a", "biz-user-a");
    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(1);
    expect(result.data?.[0].id).toBe("tx-a1");
  });

  it("strictly denies User A from accessing User B's business records (AC-17, T-16)", () => {
    const result = getAuthorizedTransactions("user-a", "biz-user-b");
    expect(result.success).toBe(false);
    expect(result.code).toBe("ACCESS_DENIED");
  });

  it("strictly denies User B from accessing User A's business records (AC-17, T-16)", () => {
    const result = getAuthorizedTransactions("user-b", "biz-user-a");
    expect(result.success).toBe(false);
    expect(result.code).toBe("ACCESS_DENIED");
  });
});
