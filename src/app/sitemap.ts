import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// De offentlige informasjonssidene. Verktøysidene (chat, redeem, buy) er
// bevisst utelatt.
const PATHS = ["", "/anonymt", "/openness", "/faq", "/privacy", "/terms"];

export default function sitemap(): MetadataRoute.Sitemap {
  return PATHS.map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: new Date(),
  }));
}
