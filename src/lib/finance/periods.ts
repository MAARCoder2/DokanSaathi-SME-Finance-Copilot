import { PeriodType } from "../../types";

export interface PeriodBoundaries {
  period: PeriodType;
  periodStart: string; // YYYY-MM-DD
  periodEnd: string; // YYYY-MM-DD
}

/**
 * Returns formatted YYYY-MM-DD string in a specific timezone
 */
export function formatDateInTimezone(date: Date, timezone: string): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(date); // en-CA outputs YYYY-MM-DD
}

/**
 * Parses YYYY-MM-DD into parts in target timezone
 */
export function getDatePartsInTimezone(date: Date, timezone: string) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    weekday: "narrow",
  });
  const parts = formatter.formatToParts(date);
  const partMap: Record<string, string> = {};
  for (const p of parts) {
    partMap[p.type] = p.value;
  }
  return {
    year: parseInt(partMap.year, 10),
    month: parseInt(partMap.month, 10),
    day: parseInt(partMap.day, 10),
  };
}

/**
 * Calculates start and end YYYY-MM-DD for daily, weekly, or monthly periods in business timezone.
 */
export function getPeriodBoundaries(
  period: PeriodType,
  referenceDate: Date = new Date(),
  timezone: string = "Asia/Dhaka"
): PeriodBoundaries {
  const dateStr = formatDateInTimezone(referenceDate, timezone);
  const [yearStr, monthStr, dayStr] = dateStr.split("-");
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10); // 1-12
  const day = parseInt(dayStr, 10);

  if (period === "daily") {
    return {
      period: "daily",
      periodStart: dateStr,
      periodEnd: dateStr,
    };
  }

  if (period === "monthly") {
    const lastDayOfMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
    const startStr = `${yearStr}-${String(month).padStart(2, "0")}-01`;
    const endStr = `${yearStr}-${String(month).padStart(2, "0")}-${String(lastDayOfMonth).padStart(2, "0")}`;
    return {
      period: "monthly",
      periodStart: startStr,
      periodEnd: endStr,
    };
  }

  // Weekly: Monday to Sunday
  // Determine day of week in timezone (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
  const utcDate = new Date(Date.UTC(year, month - 1, day));
  const dayOfWeek = utcDate.getUTCDay(); // 0 is Sunday
  // If Sunday (0), distance to Monday is -6; else distance to Monday is 1 - dayOfWeek
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const mondayDate = new Date(Date.UTC(year, month - 1, day + diffToMonday));
  const sundayDate = new Date(Date.UTC(year, month - 1, day + diffToMonday + 6));

  const formatUtc = (d: Date) => {
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, "0");
    const dt = String(d.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${dt}`;
  };

  return {
    period: "weekly",
    periodStart: formatUtc(mondayDate),
    periodEnd: formatUtc(sundayDate),
  };
}
