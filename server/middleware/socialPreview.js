const fs = require('fs');
const path = require('path');

// Social media crawler user agents
const CRAWLER_USER_AGENTS = [
  'facebookexternalhit',
  'Facebot',
  'Twitterbot',
  'LinkedInBot',
  'WhatsApp',
  'TelegramBot',
  'Slackbot',
  'Discordbot',
  'SkypeUriPreview'
];

/**
 * Middleware to serve pre-rendered HTML with OG tags for social media crawlers
 * This allows React SPA to work with Facebook, Twitter, LinkedIn previews
 */
function socialPreviewMiddleware(db) {
  return async (req, res, next) => {
    const userAgent = req.headers['user-agent'] || '';

    // Check if request is from a social media crawler
    const isCrawler = CRAWLER_USER_AGENTS.some(bot =>
      userAgent.toLowerCase().includes(bot.toLowerCase())
    );

    if (!isCrawler) {
      return next(); // Not a crawler, continue to React app
    }

    // Handle blog post URLs: /blog/:slug (supports both slugs and IDs)
    const blogMatch = req.path.match(/^\/blog\/([a-zA-Z0-9\-]+)/);

    if (blogMatch) {
      const blogSlugOrId = blogMatch[1];

      try {
        // Fetch blog post from database - try slug first, then _id
        let post = await db.collection('blogs').findOne({ slug: blogSlugOrId, status: 'published' });

        if (!post) {
          // Fallback to finding by _id for backwards compatibility
          post = await db.collection('blogs').findOne({ _id: blogSlugOrId, status: 'published' });
        }

        if (!post) {
          return next(); // Post not found, serve regular app
        }

        // Extract clean text from HTML for description
        const stripHtml = (html) => {
          if (!html) return '';
          return html.replace(/<[^>]*>/g, '').substring(0, 155);
        };

        // Use SEO metadata if available
        const metaTitle = post.metaTitle || post.title;
        const metaDescription = post.metaDescription || stripHtml(post.excerpt || post.title);
        const imageUrl = post.featuredImage || 'https://nexa.mk/nexa-logo-navbar.png';
        const fullImageUrl = imageUrl.startsWith('http') ? imageUrl : `https://nexa.mk${imageUrl}`;
        const canonicalSlug = post.slug || post._id;

        // Generate HTML with OG tags
        const html = generateBlogPostHTML({
          title: `${metaTitle} | Nexa Terminal`,
          description: metaDescription,
          image: fullImageUrl,
          url: `https://nexa.mk/blog/${canonicalSlug}`,
          siteName: 'Nexa Terminal',
          type: 'article'
        });

        res.setHeader('Content-Type', 'text/html');
        return res.send(html);
      } catch (error) {
        console.error('Error generating social preview:', error);
        return next(); // Error, serve regular app
      }
    }

    // For other pages, serve default OG tags
    return next();
  };
}

/**
 * Generate HTML with Open Graph meta tags for social media crawlers
 */
function generateBlogPostHTML({ title, description, image, url, siteName, type }) {
  return `<!DOCTYPE html>
<html lang="mk">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />

  <!-- Basic Meta -->
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}" />

  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="${type}" />
  <meta property="og:url" content="${escapeHtml(url)}" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:image" content="${escapeHtml(image)}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:site_name" content="${escapeHtml(siteName)}" />
  <meta property="og:locale" content="mk_MK" />

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:url" content="${escapeHtml(url)}" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <meta name="twitter:image" content="${escapeHtml(image)}" />
  <meta name="twitter:site" content="@NexaTerminal" />

  <!-- Redirect to actual page after crawlers get metadata -->
  <meta http-equiv="refresh" content="0; url=${escapeHtml(url)}" />

  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      background: #f5f5f5;
      color: #333;
    }
    .container {
      text-align: center;
      padding: 2rem;
    }
    h1 {
      color: #1E4DB7;
      margin-bottom: 1rem;
    }
    p {
      color: #666;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Nexa Terminal</h1>
    <p>Препраќање...</p>
  </div>
</body>
</html>`;
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

module.exports = { socialPreviewMiddleware };
