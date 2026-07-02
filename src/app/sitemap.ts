import { MetadataRoute } from 'next';
import { getSiteProducts, getSiteCategories, getSiteBrands } from '@/lib/site-actions';
import { SiteProduct, SiteCategory, SiteBrand } from '@/lib/types';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://hallmarkworld.com';

  // Fetch all dynamic data
  const [products, categories, brands] = await Promise.all([
    getSiteProducts(),
    getSiteCategories(),
    getSiteBrands(),
  ]);

  // Base routes
  const routes = [
    '',
    '/shop',
    '/b2b',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1 : 0.8,
  }));

  // Product routes
  const productRoutes = products.map((product: SiteProduct) => ({
    url: `${baseUrl}/product/${product.id}`,
    lastModified: new Date(product.updatedAt || Date.now()),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  // Category routes
  const categoryRoutes = categories.map((category: SiteCategory) => ({
    url: `${baseUrl}/category/${category.id}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));

  // Brand routes
  const brandRoutes = brands.map((brand: SiteBrand) => ({
    url: `${baseUrl}/brand/${brand.id}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.5,
  }));

  return [...routes, ...productRoutes, ...categoryRoutes, ...brandRoutes];
}
