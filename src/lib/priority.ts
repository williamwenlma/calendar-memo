export const PRIORITIES = [
  { id: "important-urgent", label: "重要且紧急", hint: "对关键目标有影响，且必须尽快处理。例如：处理突发故障、完成即将到期的关键交付。" },
  { id: "important-not-urgent", label: "重要不紧急", hint: "对目标有长期价值，暂时无需立即处理。主动留出时间，例如：长期规划、维护关系、预防问题。" },
  { id: "not-important-urgent", label: "不重要紧急", hint: "催得急，但对自己的目标贡献有限。例如：无关工作的临时催办或打断。" },
  { id: "not-important-not-urgent", label: "不重要不紧急", hint: "对目标帮助有限，也没有处理时限。例如：无目的刷资讯或消磨时间的琐事。" },
] as const;

export const PRIORITY_GUIDE = "重要：对目标有价值。紧急：需要立即或尽快处理。";

export type Priority = (typeof PRIORITIES)[number]["id"];

export function parsePriority(value: unknown): Priority | null {
  return PRIORITIES.find(({ id }) => id === value)?.id ?? null;
}

export function priorityLabel(priority: Priority | null): string {
  return PRIORITIES.find(({ id }) => id === priority)?.label ?? "未分类";
}
