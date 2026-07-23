/**
 * Parse diary file path into structured metadata.
 *
 * File paths are relative to the symlinked content/diary directory.
 * e.g.: "2026/07/22.md", "2026/07/22.intraday.md", "2026/07/22.candidates.md"
 */

export interface DiaryEntry {
  slug: string; // "2026/07/22"
  year: string;
  month: string;
  day: string;
  type: "daily" | "intraday" | "candidates" | "midday";
  filePath: string;
  title?: string;
}

export type DiaryMap = Map<string, DiaryEntry>;

/**
 * Given a relative file path like "2026/07/22.intraday.md",
 * parse out year, month, day, and type.
 */
export function parseDiaryPath(filepath: string): DiaryEntry | null {
  // Strip leading dirs and extension
  const clean = filepath
    .replace(/^.*diary\//, "")
    .replace(/\.(md|mdx)$/, "");

  // Match: YYYY/MM/DD[.intraday|.candidates|-midday|.vN]
  const match = clean.match(
    /^(\d{4})\/(\d{2})\/(\d{2})(?:[.-](intraday|candidates|midday|v\d+))?$/
  );
  if (!match) return null;

  const [, year, month, day, typeStr] = match;
  let type: DiaryEntry["type"] = "daily";
  if (typeStr === "intraday" || typeStr === "midday") type = "intraday";
  else if (typeStr === "candidates") type = "candidates";
  // v1/v2/v3 → treat as daily revision
  const slug = `${year}/${month}/${day}`;
  const shortSlug = type === "daily" ? slug : `${slug}/${type}`;

  return {
    slug: shortSlug,
    year,
    month,
    day,
    type,
    filePath: filepath,
  };
}

/**
 * Extract title from the first H1 in the raw markdown.
 */
export function extractTitle(raw: string): string {
  const match = raw.match(/^#\s+(.+?)(?:\s*\{.*\})?\s*$/m);
  return match ? match[1].trim() : "";
}

/**
 * Extract a brief description (first meaningful paragraph after the title).
 */
export function extractDescription(raw: string): string {
  const lines = raw.split("\n");
  let afterH1 = false;
  for (const line of lines) {
    if (line.startsWith("# ")) {
      afterH1 = true;
      continue;
    }
    if (afterH1 && line.trim() && !line.startsWith(">") && !line.startsWith("#")) {
      return line.trim().slice(0, 160);
    }
  }
  return "";
}

/**
 * In-memory cache for parsed entries.
 */
let diaryCache: DiaryEntry[] | null = null;

export function getDiaryEntries(): DiaryEntry[] {
  if (diaryCache) return diaryCache;

  const modules = import.meta.glob<string>(
    "../content/diary/**/*.md",
    { query: "?raw", eager: true, import: "default" }
  );

  const entries: DiaryEntry[] = [];

  for (const [filepath, raw] of Object.entries(modules)) {
    const entry = parseDiaryPath(filepath);
    if (!entry) continue;
    entry.title = extractTitle(raw);
    entries.push(entry);
  }

  // Sort descending by date
  entries.sort((a, b) => {
    const keyA = `${a.year}${a.month}${a.day}${a.type === "daily" ? "0" : a.type === "intraday" ? "1" : "2"}`;
    const keyB = `${b.year}${b.month}${b.day}${b.type === "daily" ? "0" : b.type === "intraday" ? "1" : "2"}`;
    return keyB.localeCompare(keyA);
  });

  diaryCache = entries;
  return entries;
}

/**
 * Group entries by (year, month).
 */
export function groupByMonth(
  entries: DiaryEntry[]
): Map<string, DiaryEntry[]> {
  const groups = new Map<string, DiaryEntry[]>();
  for (const e of entries) {
    const key = `${e.year}-${e.month}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(e);
  }
  return groups;
}

/** Format "07-22" */
export function formatShortDate(month: string, day: string): string {
  return `${month}-${day}`;
}

/** Format a human-readable type label */
export function typeLabel(type: DiaryEntry["type"]): string {
  switch (type) {
    case "daily":
      return "收盘复盘";
    case "intraday":
      return "盘中记录";
    case "candidates":
      return "候选标的";
  }
}
