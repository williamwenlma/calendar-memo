import type { Priority } from "./lib/priority";

export interface Memo {
  id: string;
  date: string;
  time: string | null;
  content: string;
  priority: Priority | null;
  createdAt: string;
  updatedAt: string;
}

export interface MemoDraft {
  date: string;
  time: string | null;
  content: string;
  priority: Priority;
}
