const WEEKDAYS_LONG = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];

export const BOARD_PERIODS = [
  { id: "day", label: "本日" },
  { id: "month", label: "本月" },
  { id: "quarter", label: "本季度" },
  { id: "year", label: "本年" },
] as const;

export type BoardPeriod = (typeof BOARD_PERIODS)[number]["id"];

/** Inclusive local calendar dates; never convert memo dates through UTC. */
export function getPeriodRange(period: BoardPeriod, today: Date) {
  const year = today.getFullYear();
  const month = today.getMonth();
  let start = today;
  let end = today;
  if (period === "month") {
    start = new Date(year, month, 1);
    end = new Date(year, month + 1, 0);
  } else if (period === "quarter") {
    const firstMonth = Math.floor(month / 3) * 3;
    start = new Date(year, firstMonth, 1);
    end = new Date(year, firstMonth + 3, 0);
  } else if (period === "year") {
    start = new Date(year, 0, 1);
    end = new Date(year, 11, 31);
  }
  return { start: toDateKey(start), end: toDateKey(end) };
}

export function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function fromDateKey(key: string): Date {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function startOfCalendarGrid(viewDate: Date): Date {
  const first = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
  const mondayIndex = (first.getDay() + 6) % 7;
  return new Date(first.getFullYear(), first.getMonth(), 1 - mondayIndex);
}

export function getCalendarDays(viewDate: Date): Date[] {
  const start = startOfCalendarGrid(viewDate);
  return Array.from({ length: 42 }, (_, index) =>
    new Date(start.getFullYear(), start.getMonth(), start.getDate() + index),
  );
}

export function moveMonth(viewDate: Date, offset: number): Date {
  return new Date(viewDate.getFullYear(), viewDate.getMonth() + offset, 1);
}

export function formatSelectedDate(key: string): string {
  const date = fromDateKey(key);
  return `${date.getMonth() + 1}月${date.getDate()}日 ${WEEKDAYS_LONG[date.getDay()]}`;
}

export function isSameMonth(date: Date, viewDate: Date): boolean {
  return date.getFullYear() === viewDate.getFullYear() && date.getMonth() === viewDate.getMonth();
}
