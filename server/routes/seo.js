/**
 * SEO Routes
 * Handles sitemap generation and other SEO-related endpoints
 */

const express = require('express');
const router = express.Router();

// Base URL for the site
const BASE_URL = 'https://nexa.mk';

/**
 * GET /api/seo/sitemap.xml
 * Generates dynamic XML sitemap including all published blog posts
 */
router.get('/sitemap.xml', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const blogsCollection = db.collection('blogs');

    // Get all published blogs
    const blogs = await blogsCollection.find({
      status: 'published'
    }).project({
      slug: 1,
      _id: 1,
      updatedAt: 1,
      createdAt: 1
    }).sort({ createdAt: -1 }).toArray();

    // Static pages with their priorities and change frequencies
    const staticPages = [
      { url: '/', priority: '1.0', changefreq: 'daily' },
      { url: '/blog', priority: '0.9', changefreq: 'daily' },
      { url: '/about', priority: '0.7', changefreq: 'monthly' },
      { url: '/contact', priority: '0.6', changefreq: 'monthly' },
      { url: '/pricing', priority: '0.8', changefreq: 'weekly' },
      { url: '/legal-health-check', priority: '0.8', changefreq: 'weekly' },
      { url: '/marketing-health-check', priority: '0.8', changefreq: 'weekly' },
      { url: '/company-health-check', priority: '0.8', changefreq: 'weekly' },
      { url: '/login', priority: '0.5', changefreq: 'monthly' },
      { url: '/register', priority: '0.5', changefreq: 'monthly' }
    ];

    // Current date for lastmod
    const now = new Date().toISOString().split('T')[0];

    // Build XML sitemap
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    // Add static pages
    for (const page of staticPages) {
      xml += '  <url>\n';
      xml += `    <loc>${BASE_URL}${page.url}</loc>\n`;
      xml += `    <lastmod>${now}</lastmod>\n`;
      xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
      xml += `    <priority>${page.priority}</priority>\n`;
      xml += '  </url>\n';
    }

    // Add blog posts
    for (const blog of blogs) {
      const slug = blog.slug || blog._id;
      const lastmod = blog.updatedAt || blog.createdAt;
      const lastmodDate = lastmod ? new Date(lastmod).toISOString().split('T')[0] : now;

      xml += '  <url>\n';
      xml += `    <loc>${BASE_URL}/blog/${slug}</loc>\n`;
      xml += `    <lastmod>${lastmodDate}</lastmod>\n`;
      xml += '    <changefreq>weekly</changefreq>\n';
      xml += '    <priority>0.8</priority>\n';
      xml += '  </url>\n';
    }

    xml += '</urlset>';

    // Set content type and send response
    res.set('Content-Type', 'application/xml');
    res.set('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    res.send(xml);

  } catch (error) {
    console.error('Error generating sitemap:', error);
    res.status(500).send('Error generating sitemap');
  }
});

/**
 * GET /api/seo/robots.txt
 * Serves dynamic robots.txt
 */
router.get('/robots.txt', (req, res) => {
  const robotsTxt = `User-agent: *
Allow: /

# Sitemaps
Sitemap: ${BASE_URL}/api/seo/sitemap.xml

# Disallow admin and terminal areas
Disallow: /terminal/
Disallow: /admin/
Disallow: /api/

# Allow specific public API endpoints for SEO
Allow: /api/seo/
Allow: /api/blog/
`;

  res.set('Content-Type', 'text/plain');
  res.set('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
  res.send(robotsTxt);
});

module.exports = router;
