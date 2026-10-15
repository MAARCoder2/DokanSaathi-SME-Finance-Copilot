import { PeriodType } from "../../types";

export interface PeriodBoundaries {
  period: PeriodType;
  periodStart: string; // YYYY-MM-DD
  periodEnd: string; // YYYY-MM-DD
  label: string;
  formattedRange: string;
}

const SHORT_MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

const FULL_MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

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
 * Formats a calendar YYYY-MM-DD string safely without timezone shifting
 */
export function formatCalendarDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return `${d} ${SHORT_MONTHS[m - 1]} ${y}`;
}

/**
 * Calculates start and end YYYY-MM-DD for daily, weekly, or monthly periods in business timezone.
 * Explicitly enforces Monday-to-Sunday business week convention.
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
      label: "Today",
      formattedRange: `Today · ${day} ${SHORT_MONTHS[month - 1]} ${year}`,
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
      label: "This Month",
      formattedRange: `This Month · ${FULL_MONTHS[month - 1]} ${year}`,
    };
  }

  // Weekly: Monday to Sunday (Standard Business Week)
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

  const startStr = formatUtc(mondayDate);
  const endStr = formatUtc(sundayDate);

  const startDay = mondayDate.getUTCDate();
  const startMonth = mondayDate.getUTCMonth() + 1;
  const endDay = sundayDate.getUTCDate();
  const endMonth = sundayDate.getUTCMonth() + 1;
  const endYear = sundayDate.getUTCFullYear();

  let formattedRange = "";
  if (startMonth === endMonth) {
    formattedRange = `This Week · ${startDay}–${endDay} ${SHORT_MONTHS[startMonth - 1]} ${endYear}`;
  } else {
    formattedRange = `This Week · ${startDay} ${SHORT_MONTHS[startMonth - 1]} – ${endDay} ${SHORT_MONTHS[endMonth - 1]} ${endYear}`;
  }

  return {
    period: "weekly",
    periodStart: startStr,
    periodEnd: endStr,
    label: "This Week",
    formattedRange,
  };
}
