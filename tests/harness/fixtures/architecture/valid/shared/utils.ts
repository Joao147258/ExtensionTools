export function formatTimestamp(date: Date = new Date()): string {
  return date.toISOString();
}

export function safeJsonStringify(data: unknown): string {
  return JSON.stringify(data);
}
