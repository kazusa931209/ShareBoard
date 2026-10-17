export function truncateText(value: string, maxLength = 200): string {
  if (value.length <= maxLength) {
    return value;
  }
  return `${value.slice(0, maxLength)}…`;
}

/** Format as YYYY/MM/DD HH:MM:SS in local timezone */
export function formatBoardDateTime(iso: string): string {
  const normalized = iso.includes("T")
    ? iso
    : iso.replace(" ", "T").replace(/(\.\d+)?$/, "") + "Z";
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}/${pad(date.getMonth() + 1)}/${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}
