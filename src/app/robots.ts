import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Verktøysidene har ingen verdi i søk, og bør ikke dukke opp der.
      disallow: ["/chat", "/redeem", "/buy", "/api/"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
