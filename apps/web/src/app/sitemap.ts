import { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://teramisu.com";
const serverUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${siteUrl}/shop`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/cart`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: `${siteUrl}/login`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${siteUrl}/signup`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  // Fetch products for dynamic pages
  let productPages: MetadataRoute.Sitemap = [];
  try {
    const res = await fetch(`${serverUrl}/api/products`, {
      next: { revalidate: 3600 }, // Revalidate every hour
    });

    if (res.ok) {
      const data = await res.json();
      productPages = (data.products || []).map(
        (product: { id: string; updatedAt?: string }) => ({
          url: `${siteUrl}/shop/${product.id}`,
          lastModified: product.updatedAt ? new Date(product.updatedAt) : new Date(),
          changeFrequency: "weekly" as const,
          priority: 0.8,
        })
      );
    }
  } catch (error) {
    console.error("Failed to fetch products for sitemap:", error);
  }

  // Fetch categories for dynamic pages
  let categoryPages: MetadataRoute.Sitemap = [];
  try {
    const res = await fetch(`${serverUrl}/api/categories`, {
      next: { revalidate: 3600 },
    });

    if (res.ok) {
      const categories = await res.json();
      categoryPages = (categories || []).map(
        (category: { slug: string; updatedAt?: string }) => ({
          url: `${siteUrl}/shop/category/${category.slug}`,
          lastModified: category.updatedAt ? new Date(category.updatedAt) : new Date(),
          changeFrequency: "weekly" as const,
          priority: 0.7,
        })
      );
    }
  } catch (error) {
    console.error("Failed to fetch categories for sitemap:", error);
  }

  return [...staticPages, ...productPages, ...categoryPages];
}

