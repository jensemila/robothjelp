import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// De offentlige informasjonssidene. Verktøysidene (chat, redeem, buy) er
// bevisst utelatt. Prioritet signaliserer hvilke sider som er viktigst.
const PAGES: {
  path: string;
  priority: number;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
}[] = [
  { path: "", priority: 1, changeFrequency: "weekly" },
  { path: "/faq", priority: 0.9, changeFrequency: "monthly" },
  { path: "/openness", priority: 0.8, changeFrequency: "monthly" },
  { path: "/anonymt", priority: 0.7, changeFrequency: "monthly" },
  { path: "/privacy", priority: 0.4, changeFrequency: "yearly" },
  { path: "/terms", priority: 0.4, changeFrequency: "yearly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return PAGES.map(({ path, priority, changeFrequency }) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
  }));
}
