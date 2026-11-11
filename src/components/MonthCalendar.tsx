import { memo, useEffect, useRef, useState } from "react";
import { getCalendarDays, isSameMonth, toDateKey } from "../lib/date";
import { priorityLabel } from "../lib/priority";
import type { Memo } from "../types";

const WEEKDAYS = ["一", "二", "三", "四", "五", "六", "日"];

interface MonthCalendarProps {
  viewDate: Date;
  selectedDate: string;
  todayKey: string;
  memosByDate: Map<string, Memo[]>;
  onSelectDate: (date: Date) => void;
  onQuickAdd: (date: Date) => void;
}

export const MonthCalendar = memo(function MonthCalendar({
  viewDate,
  selectedDate,
  todayKey,
  memosByDate,
  onSelectDate,
  onQuickAdd,
}: MonthCalendarProps) {
  const calendarDays = getCalendarDays(viewDate);
  const gridRef = useRef<HTMLDivElement>(null);
  const [previewLimit, setPreviewLimit] = useState(1);

  useEffect(() => {
    const element = gridRef.current;
    if (!element) return;
    const observer = new ResizeObserver(() => {
      const rowHeight = element.clientHeight / 6;
      setPreviewLimit(rowHeight >= 88 ? 2 : rowHeight >= 59 ? 1 : 0);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="calendar-shell" aria-label={`${viewDate.getFullYear()}年${viewDate.getMonth() + 1}月日历`}>
      <div className="weekday-row" aria-hidden="true">
        {WEEKDAYS.map((weekday) => (
          <div key={weekday}>周{weekday}</div>
        ))}
      </div>
      <div className="calendar-grid" ref={gridRef}>
        {calendarDays.map((date) => {
          const key = toDateKey(date);
          const dayMemos = memosByDate.get(key) ?? [];
          const inMonth = isSameMonth(date, viewDate);
          const isToday = key === todayKey;
          const isSelected = key === selectedDate;
          return (
            <button
              key={key}
              type="button"
              className={`day-cell${inMonth ? "" : " outside"}${isToday ? " today" : ""}${isSelected ? " selected" : ""}`}
              onClick={() => onSelectDate(date)}
              onDoubleClick={() => onQuickAdd(date)}
              aria-label={`${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日，${dayMemos.length}条事项`}
              aria-pressed={isSelected}
            >
              <span className="day-number">
                <span>{date.getDate()}</span>
                {isToday ? <span className="today-label">今</span> : null}
              </span>
              <span className="day-events">
                {dayMemos.slice(0, previewLimit).map((memoItem) => (
                  <span className="event-preview" data-priority={memoItem.priority ?? undefined} key={memoItem.id} title={`${memoItem.time ?? "全天"} ${memoItem.content} · ${priorityLabel(memoItem.priority)}`}>
                    <span>{memoItem.time ?? "全天"}</span>
                    <b>{memoItem.content}</b>
                  </span>
                ))}
                {dayMemos.length > previewLimit ? <span className="more-events">还有 {dayMemos.length - previewLimit} 条</span> : null}
              </span>
              {dayMemos.length > 0 ? <span className="day-count" aria-hidden="true">{dayMemos.length} 条</span> : null}
            </button>
          );
        })}
      </div>
    </section>
  );
});
