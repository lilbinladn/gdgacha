export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function percent(part: number, total: number): number {
  if (!total) return 0;
  return (part / total) * 100;
}

export function formatPercent(value: number, digits = 2): string {
  return `${value.toFixed(digits)}%`;
}

export function formatNumber(value: number): string {
  return value.toLocaleString("en-US");
}

export function timeAgo(timestamp: number, now = Date.now()): string {
  const seconds = Math.max(0, Math.floor((now - timestamp) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
