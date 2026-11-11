import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarHeader, MonthToolbar } from "./components/CalendarHeader";
import { ConfirmDialog } from "./components/ConfirmDialog";
import { DayPanel } from "./components/DayPanel";
import { MonthCalendar } from "./components/MonthCalendar";
import { PriorityBoard } from "./components/PriorityBoard";
import { createMemo, deleteMemo, listMemos, updateMemo } from "./lib/memoRepository";
import { fromDateKey, moveMonth, toDateKey, type BoardPeriod } from "./lib/date";
import type { Memo, MemoDraft } from "./types";

function sortMemos(memos: Memo[]): Memo[] {
  return [...memos].sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    if (a.time && !b.time) return -1;
    if (!a.time && b.time) return 1;
    return (a.time ?? "").localeCompare(b.time ?? "") || a.createdAt.localeCompare(b.createdAt);
  });
}

export default function App() {
  const [view, setView] = useState<"calendar" | "board">("calendar");
  const [boardPeriod, setBoardPeriod] = useState<BoardPeriod>("day");
  const [requestedEdit, setRequestedEdit] = useState<Memo | null>(null);
  const todayKey = useMemo(() => toDateKey(new Date()), []);
  const [viewDate, setViewDate] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState(todayKey);
  const [memos, setMemos] = useState<Memo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [memoToDelete, setMemoToDelete] = useState<Memo | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [focusToken, setFocusToken] = useState(0);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    listMemos()
      .then((items) => active && setMemos(sortMemos(items)))
      .catch(() => active && setMessage("无法读取本地记录，请重新启动应用后再试。"))
      .finally(() => active && setIsLoading(false));
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => setMessage(null), 3600);
    return () => window.clearTimeout(timer);
  }, [message]);

  const memosByDate = useMemo(() => {
    const map = new Map<string, Memo[]>();
    for (const memo of memos) {
      const items = map.get(memo.date);
      if (items) items.push(memo);
      else map.set(memo.date, [memo]);
    }
    return map;
  }, [memos]);

  const selectedMemos = memosByDate.get(selectedDate) ?? [];

  const selectDate = useCallback((date: Date) => {
    setRequestedEdit(null);
    setSelectedDate(toDateKey(date));
    setViewDate(new Date(date.getFullYear(), date.getMonth(), 1));
  }, []);

  const quickAdd = useCallback((date: Date) => {
    selectDate(date);
    setFocusToken((value) => value + 1);
  }, [selectDate]);

  async function saveMemo(draft: MemoDraft, editingId: string | null): Promise<boolean> {
    setIsSaving(true);
    try {
      const saved = editingId ? await updateMemo(editingId, draft) : await createMemo(draft);
      setMemos((current) => sortMemos(editingId
        ? current.map((memo) => (memo.id === saved.id ? saved : memo))
        : [...current, saved]));
      setMessage(editingId ? "事项已更新" : "事项已保存");
      return true;
    } catch {
      setMessage("保存失败，请稍后重试。");
      return false;
    } finally {
      setIsSaving(false);
    }
  }

  async function confirmDelete() {
    if (!memoToDelete) return;
    setIsDeleting(true);
    try {
      await deleteMemo(memoToDelete.id);
      setMemos((current) => current.filter((memo) => memo.id !== memoToDelete.id));
      setMemoToDelete(null);
      setMessage("事项已删除");
    } catch {
      setMessage("删除失败，请稍后重试。");
    } finally {
      setIsDeleting(false);
    }
  }

  function returnToday() {
    selectDate(fromDateKey(todayKey));
  }

  function goToMonth(month: Date) {
    const year = month.getFullYear();
    const monthIndex = month.getMonth();
    const lastDay = new Date(year, monthIndex + 1, 0).getDate();
    selectDate(new Date(year, monthIndex, Math.min(fromDateKey(selectedDate).getDate(), lastDay)));
  }

  function editFromBoard(memo: Memo) {
    selectDate(fromDateKey(memo.date));
    setRequestedEdit(memo);
    setFocusToken((value) => value + 1);
    setView("calendar");
  }

  return (
    <main className="app-shell">
      <CalendarHeader view={view} onViewChange={setView} todayKey={todayKey} />
      <div className="workspace" hidden={view !== "calendar"}>
        {isLoading ? <div className="loading-layer">正在读取日历…</div> : null}
        <div className="calendar-pane">
          <MonthToolbar
            key={view}
            viewDate={viewDate}
            onPrevious={() => goToMonth(moveMonth(viewDate, -1))}
            onNext={() => goToMonth(moveMonth(viewDate, 1))}
            onToday={returnToday}
            onJump={(year, month) => goToMonth(new Date(year, month, 1))}
          />
          <MonthCalendar
            viewDate={viewDate}
            selectedDate={selectedDate}
            todayKey={todayKey}
            memosByDate={memosByDate}
            onSelectDate={selectDate}
            onQuickAdd={quickAdd}
          />
        </div>
        <DayPanel
          selectedDate={selectedDate}
          memos={selectedMemos}
          focusToken={focusToken}
          initialMemo={requestedEdit?.date === selectedDate ? requestedEdit : null}
          isSaving={isSaving}
          onSave={saveMemo}
          onDelete={setMemoToDelete}
        />
      </div>
      {view === "board" ? (
        isLoading ? <p role="status">正在读取事项…</p> : (
          <PriorityBoard memos={memos} onEdit={editFromBoard} period={boardPeriod} onPeriodChange={setBoardPeriod} />
        )
      ) : null}
      {message ? <div className="toast" role="status">{message}</div> : null}
      {memoToDelete ? (
        <ConfirmDialog memo={memoToDelete} isDeleting={isDeleting} onCancel={() => setMemoToDelete(null)} onConfirm={confirmDelete} />
      ) : null}
    </main>
  );
}
