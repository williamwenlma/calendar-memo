import { PRIORITIES, PRIORITY_GUIDE, type Priority } from "../lib/priority";
import type { Memo } from "../types";
import { Pencil } from "./Icons";
import { BOARD_PERIODS, getPeriodRange, type BoardPeriod } from "../lib/date";

interface PriorityBoardProps {
  memos: Memo[];
  onEdit: (memo: Memo) => void;
  period: BoardPeriod;
  onPeriodChange: (period: BoardPeriod) => void;
}

function BoardItems({ memos, onEdit }: Pick<PriorityBoardProps, "memos" | "onEdit">) {
  return (
    <ul className="board-items">
      {memos.map((memo) => (
        <li key={memo.id}>
          <button type="button" className="board-memo" onClick={() => onEdit(memo)} aria-label={`编辑${memo.content}`}>
            <span className="board-memo-copy">
              <strong>{memo.content}</strong>
              <span><time dateTime={memo.date}>{memo.date}</time> · {memo.time ?? "全天"}</span>
            </span>
            <Pencil size={16} aria-hidden="true" />
          </button>
        </li>
      ))}
    </ul>
  );
}

export function PriorityBoard({ memos, onEdit, period, onPeriodChange }: PriorityBoardProps) {
  const range = getPeriodRange(period, new Date());
  const visibleMemos = memos.filter((memo) => memo.date >= range.start && memo.date <= range.end);
  const groups = new Map<Priority | null, Memo[]>();
  for (const memo of visibleMemos) {
    const group = groups.get(memo.priority);
    if (group) group.push(memo);
    else groups.set(memo.priority, [memo]);
  }
  const unclassified = groups.get(null);

  return (
    <section className="priority-board" aria-labelledby="board-title">
      <div className="board-heading">
        <div><h1 id="board-title">四象限看板</h1><p>{PRIORITY_GUIDE}</p></div>
      </div>
      <div className="board-toolbar">
        <div className="view-switcher period-switcher" role="group" aria-label="看板日期范围">
          {BOARD_PERIODS.map(({ id, label }) => (
            <button key={id} type="button" aria-pressed={period === id} onClick={() => onPeriodChange(id)}>{label}</button>
          ))}
        </div>
        <p className="board-range-summary" aria-live="polite">
          <span>{period === "day" ? `今天 · ${range.start}` : `${range.start} 至 ${range.end}`}</span>
          <span>共 {visibleMemos.length} 项</span>
        </p>
      </div>
      <div className="quadrant-grid">
        {PRIORITIES.map(({ id, label, hint }) => {
          const items = groups.get(id) ?? [];
          return (
            <section className="quadrant" key={id} data-priority={id} aria-labelledby={`quadrant-${id}`}>
              <header className="quadrant-header">
                <div><h2 id={`quadrant-${id}`}>{label}</h2><p>{hint}</p></div>
                <span>{items.length} 项</span>
              </header>
              {items.length ? <BoardItems memos={items} onEdit={onEdit} /> : <p className="quadrant-empty">暂无事项</p>}
            </section>
          );
        })}
      </div>
      {unclassified?.length ? (
        <section className="quadrant unclassified" aria-labelledby="unclassified-title">
          <header className="quadrant-header">
            <div><h2 id="unclassified-title">未分类</h2><p>旧版事项保留在这里，点击事项即可补选标签。</p></div>
            <span>{unclassified.length} 项</span>
          </header>
          <BoardItems memos={unclassified} onEdit={onEdit} />
        </section>
      ) : null}
      <p className="board-source">分类依据：史蒂芬·柯维《高效能人士的七个习惯》习惯三「要事第一」</p>
    </section>
  );
}
