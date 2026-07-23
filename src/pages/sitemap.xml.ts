import { getDiaryEntries } from "../utils/diary";

export async function GET(context: { site: string | URL }) {
  const siteUrl = String(context.site).replace(/\/$/, "");
  const entries = getDiaryEntries();
  const urls = [
    { path: "", priority: 1.0, freq: "daily" },
    ...entries
      .filter((e) => e.type === "daily")
      .map((e) => ({
        path: `diary/${e.slug}`,
        priority: 0.8,
        freq: "monthly" as const,
      })),
  ];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${siteUrl}/${u.path}</loc>
    <changefreq>${u.freq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
  )
  .join("\n")}
</urlset>`;

  return new Response(sitemap, {
    headers: { "Content-Type": "application/xml" },
  });
}
