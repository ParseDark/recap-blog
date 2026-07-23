import { getDiaryEntries } from "../utils/diary";

export async function GET(context: { site: string | URL }) {
  const entries = getDiaryEntries();
  const siteUrl = String(context.site).replace(/\/$/, "");

  const items = entries
    .filter((e) => e.type === "daily")
    .slice(0, 30)
    .map(
      (entry) => `    <item>
      <title><![CDATA[${entry.title || `${entry.year}-${entry.month}-${entry.day} 复盘`}]]></title>
      <link>${siteUrl}/diary/${entry.slug}</link>
      <description><![CDATA[${entry.year}年${entry.month}月${entry.day}日 A股市场复盘分析]]></description>
      <pubDate>${new Date(`${entry.year}-${entry.month}-${entry.day}T15:00:00+08:00`).toUTCString()}</pubDate>
      <guid isPermaLink="true">${siteUrl}/diary/${entry.slug}</guid>
    </item>`
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>A股复盘日记</title>
    <link>${siteUrl}</link>
    <description>AI agent 每日自动生成的 A 股市场情绪复盘分析，包含市场广度、板块轮动、资金方向与交易决策</description>
    <language>zh-CN</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${siteUrl}/rss.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
