import { useRef, useState } from "react";
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight } from "./Icons";
import { formatSelectedDate } from "../lib/date";

interface CalendarHeaderProps {
  view: "calendar" | "board";
  onViewChange: (view: "calendar" | "board") => void;
  todayKey: string;
}

interface MonthToolbarProps {
  viewDate: Date;
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
  onJump: (year: number, month: number) => void;
}

export function CalendarHeader({ view, onViewChange, todayKey }: CalendarHeaderProps) {
  return (
    <header className="app-header">
      <div className="brand" aria-label="日历便签">
        <CalendarDays size={18} strokeWidth={1.7} aria-hidden="true" />
        <span>日历便签</span>
      </div>

      <nav className="app-nav" aria-label="切换视图">
        <button type="button" aria-pressed={view === "calendar"} onClick={() => onViewChange("calendar")}>日历</button>
        <button type="button" aria-pressed={view === "board"} onClick={() => onViewChange("board")}>四象限看板</button>
      </nav>
      <time className="header-date" dateTime={todayKey}>{todayKey.replaceAll("-", " / ")} · {formatSelectedDate(todayKey).split(" ")[1]}</time>
    </header>
  );
}

export function MonthToolbar({ viewDate, onPrevious, onNext, onToday, onJump }: MonthToolbarProps) {
  const [isChoosing, setIsChoosing] = useState(false);
  const pickerButton = useRef<HTMLButtonElement>(null);
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth() + 1;
  const firstYear = Math.min(2015, year);
  const years = Array.from({ length: Math.max(2045, year) - firstYear + 1 }, (_, index) => firstYear + index);

  function closePicker() {
    setIsChoosing(false);
    pickerButton.current?.focus();
  }

  return (
    <div className="month-toolbar" onKeyDown={(event) => {
      if (event.key === "Escape" && isChoosing) {
        closePicker();
      }
    }}>
        <div className="month-picker-wrap">
          <button
            type="button"
            className="month-title"
            ref={pickerButton}
            aria-label={`选择年月：${year}年${month}月`}
            onClick={() => setIsChoosing((value) => !value)}
            aria-expanded={isChoosing}
          >
            <span className="month-caption">{year} 年 · 月历 <ChevronDown size={13} aria-hidden="true" /></span>
            <span className="month-display"><strong>{month}</strong> 月</span>
          </button>
          {isChoosing ? (
            <div className="month-popover">
              <label>
                <span>年份</span>
                <select
                  aria-label="年份"
                  value={viewDate.getFullYear()}
                  onChange={(event) => onJump(Number(event.target.value), viewDate.getMonth())}
                >
                  {years.map((year) => <option key={year}>{year}</option>)}
                </select>
              </label>
              <label>
                <span>月份</span>
                <select
                  aria-label="月份"
                  value={viewDate.getMonth()}
                  onChange={(event) => onJump(viewDate.getFullYear(), Number(event.target.value))}
                >
                  {Array.from({ length: 12 }, (_, month) => (
                    <option key={month} value={month}>{month + 1}月</option>
                  ))}
                </select>
              </label>
              <button type="button" onClick={closePicker}>完成</button>
            </div>
          ) : null}
        </div>
      <div className="month-navigation">
        <button className="icon-button" type="button" onClick={() => { setIsChoosing(false); onPrevious(); }} aria-label="上个月">
          <ChevronLeft size={16} />
        </button>
        <button className="icon-button" type="button" onClick={() => { setIsChoosing(false); onNext(); }} aria-label="下个月">
          <ChevronRight size={16} />
        </button>
        <button className="today-button" type="button" onClick={() => { setIsChoosing(false); onToday(); }}>回到今天</button>
      </div>
    </div>
  );
}
