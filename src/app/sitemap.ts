import type { MetadataRoute } from "next";

const base = "https://www.courtfuel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return [
    { url: `${base}/`, lastModified, priority: 1 },
    { url: `${base}/terms`, lastModified, priority: 0.5 },
    { url: `${base}/support`, lastModified, priority: 0.5 },
    { url: `${base}/privacy`, lastModified, priority: 0.3 },
  ];
}
