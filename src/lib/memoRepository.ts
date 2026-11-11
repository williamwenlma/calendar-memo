import type { Memo, MemoDraft } from "../types";
import { parsePriority } from "./priority";

const DATABASE_URL = "sqlite:calendar-memo.db";
const STORAGE_KEY = "calendar-memo:memos:v1";

interface DatabaseConnection {
  select<T>(query: string, bindValues?: unknown[]): Promise<T>;
  execute(query: string, bindValues?: unknown[]): Promise<unknown>;
}

let databasePromise: Promise<DatabaseConnection> | null = null;

const IS_TAURI = import.meta.env.MODE !== "standalone" && "__TAURI_INTERNALS__" in window;

async function getDatabase(): Promise<DatabaseConnection> {
  if (!databasePromise) {
    databasePromise = import("@tauri-apps/plugin-sql").then(async ({ default: Database }) =>
      Database.load(DATABASE_URL),
    );
  }
  return databasePromise;
}

function readBrowserMemos(): Memo[] {
  const records = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") as Memo[];
  return records.map((memo) => ({ ...memo, priority: parsePriority(memo.priority) }));
}

function writeBrowserMemos(memos: Memo[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(memos));
}

function mapRow(row: Record<string, string | null>): Memo {
  return {
    id: row.id ?? "",
    date: row.date ?? "",
    time: row.time,
    content: row.content ?? "",
    priority: parsePriority(row.priority),
    createdAt: row.created_at ?? "",
    updatedAt: row.updated_at ?? "",
  };
}

export async function listMemos(): Promise<Memo[]> {
  if (!IS_TAURI) return readBrowserMemos();

  const db = await getDatabase();
  const rows = await db.select<Record<string, string | null>[]>(
    "SELECT id, date, time, content, priority, created_at, updated_at FROM memos ORDER BY date, CASE WHEN time IS NULL OR time = '' THEN 1 ELSE 0 END, time, created_at",
  );
  return rows.map(mapRow);
}

export async function createMemo(draft: MemoDraft): Promise<Memo> {
  const now = new Date().toISOString();
  const memo: Memo = {
    ...draft,
    id: crypto.randomUUID?.() ?? Array.from(crypto.getRandomValues(new Uint8Array(16)), (byte) => byte.toString(16).padStart(2, "0")).join(""),
    createdAt: now,
    updatedAt: now,
  };

  if (!IS_TAURI) {
    writeBrowserMemos([...readBrowserMemos(), memo]);
    return memo;
  }

  const db = await getDatabase();
  await db.execute(
    "INSERT INTO memos (id, date, time, content, priority, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7)",
    [memo.id, memo.date, memo.time, memo.content, memo.priority, memo.createdAt, memo.updatedAt],
  );
  return memo;
}

export async function updateMemo(id: string, draft: MemoDraft): Promise<Memo> {
  const existing = (await listMemos()).find((memo) => memo.id === id);
  if (!existing) throw new Error("找不到需要修改的事项");

  const memo: Memo = { ...existing, ...draft, updatedAt: new Date().toISOString() };
  if (!IS_TAURI) {
    writeBrowserMemos(readBrowserMemos().map((item) => (item.id === id ? memo : item)));
    return memo;
  }

  const db = await getDatabase();
  await db.execute(
    "UPDATE memos SET date = $1, time = $2, content = $3, priority = $4, updated_at = $5 WHERE id = $6",
    [memo.date, memo.time, memo.content, memo.priority, memo.updatedAt, memo.id],
  );
  return memo;
}

export async function deleteMemo(id: string): Promise<void> {
  if (!IS_TAURI) {
    writeBrowserMemos(readBrowserMemos().filter((memo) => memo.id !== id));
    return;
  }

  const db = await getDatabase();
  await db.execute("DELETE FROM memos WHERE id = $1", [id]);
}
