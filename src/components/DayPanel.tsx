import { useEffect, useRef, useState, type FormEvent, type FormEventHandler } from "react";
import { formatSelectedDate } from "../lib/date";
import { parsePriority, PRIORITIES, PRIORITY_GUIDE, priorityLabel, type Priority } from "../lib/priority";
import type { Memo, MemoDraft } from "../types";
import { Pencil, Trash2, X } from "./Icons";

interface DayPanelProps {
  selectedDate: string;
  memos: Memo[];
  focusToken: number;
  initialMemo: Memo | null;
  isSaving: boolean;
  onSave: (draft: MemoDraft, editingId: string | null) => Promise<boolean>;
  onDelete: (memo: Memo) => void;
}

export function DayPanel({ selectedDate, memos, focusToken, initialMemo, isSaving, onSave, onDelete }: DayPanelProps) {
  const [time, setTime] = useState("");
  const [content, setContent] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [priority, setPriority] = useState<Priority | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const handleTimeInput: FormEventHandler<HTMLInputElement> = (event) => setTime(event.currentTarget.value);

  useEffect(() => {
    setTime(initialMemo?.time ?? "");
    setContent(initialMemo?.content ?? "");
    setPriority(initialMemo?.priority ?? null);
    setEditingId(initialMemo?.id ?? null);
  }, [selectedDate, initialMemo]);

  useEffect(() => {
    if (focusToken > 0) inputRef.current?.focus();
  }, [focusToken]);

  function clearForm() {
    setTime("");
    setContent("");
    setEditingId(null);
    setPriority(null);
    inputRef.current?.focus();
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const normalized = content.trim();
    if (!normalized) {
      inputRef.current?.focus();
      return;
    }
    if (!priority || isSaving) return;
    const saved = await onSave({ date: selectedDate, time: time || null, content: normalized, priority }, editingId);
    if (saved) clearForm();
  }

  function beginEdit(memo: Memo) {
    setTime(memo.time ?? "");
    setContent(memo.content);
    setEditingId(memo.id);
    setPriority(memo.priority);
    inputRef.current?.focus();
  }

  const [dateLabel, weekday] = formatSelectedDate(selectedDate).split(" ");
  const form = (
      <form className="memo-form" onSubmit={handleSubmit}>
        <h3>{editingId ? "编辑便签" : "记一条便签"}</h3>
        <label className="field content-field">
          <span>事项内容</span>
          <input
            ref={inputRef}
            value={content}
            maxLength={200}
            onChange={(event) => setContent(event.target.value)}
            placeholder="写下要做的事情…"
            aria-required="true"
          />
        </label>
        <label className="field time-field">
          <span>时间（可选）</span>
          <input type="time" value={time} onInput={handleTimeInput} onChange={(event) => setTime(event.target.value)} />
        </label>
        <label className="field priority-field">
          <span>事项标签</span>
          <select required aria-label="事项标签" aria-describedby="priority-hint" value={priority ?? ""} onChange={(event) => setPriority(parsePriority(event.target.value))}>
            <option value="" disabled>请选择标签</option>
            {PRIORITIES.map(({ id, label }) => <option key={id} value={id}>{label}</option>)}
          </select>
        </label>
        <p className="priority-hint" id="priority-hint">{PRIORITIES.find(({ id }) => id === priority)?.hint ?? PRIORITY_GUIDE}</p>
        <div className="form-actions">
          {editingId ? (
            <button className="cancel-edit" type="button" onClick={clearForm}><X size={16} />取消编辑</button>
          ) : <span />}
          <button className="primary-button" type="submit" disabled={isSaving || !content.trim()}>
            {isSaving ? "正在保存…" : editingId ? "保存修改" : "添加事项"}
          </button>
        </div>
      </form>
  );

  return (
    <aside className="day-panel" aria-label="当天事项编辑区">
      <header className="day-panel-heading">
        <p>{weekday} · 当天事项</p>
        <h2><time dateTime={selectedDate}>{dateLabel}</time></h2>
        <p>{memos.length} 条便签</p>
        <button className="mobile-add" type="button" onClick={() => inputRef.current?.focus()}>去录入</button>
      </header>

      <div className="agenda-list">
        {memos.length ? memos.map((memo) => (
          <article className={`agenda-item${editingId === memo.id ? " editing" : ""}`} key={memo.id}>
            <time>{memo.time ?? "全天"}</time>
            <div className="agenda-copy">
              <p>{memo.content}</p>
              <span className="priority-badge" data-priority={memo.priority ?? undefined}>{priorityLabel(memo.priority)}</span>
            </div>
            <div className="agenda-actions">
              <button type="button" onClick={() => beginEdit(memo)} aria-label={`编辑${memo.content}`} title="编辑">
                <Pencil size={17} />
              </button>
              <button className="delete-action" type="button" onClick={() => onDelete(memo)} aria-label={`删除${memo.content}`} title="删除">
                <Trash2 size={17} />
              </button>
            </div>
          </article>
        )) : (
          <div className="empty-state">
            <p>这一天还没有事项</p>
            <small>可在下方记录当天的安排。</small>
          </div>
        )}
      </div>
      {form}
      <p className="panel-tip">提示：双击任意日期，可以立即开始记录。</p>
    </aside>
  );
}
