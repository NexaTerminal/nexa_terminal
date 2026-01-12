// Vercel Serverless Function to handle social media previews for blog posts
const https = require('https');

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

function isCrawler(userAgent) {
  if (!userAgent) return false;
  return CRAWLER_USER_AGENTS.some(bot =>
    userAgent.toLowerCase().includes(bot.toLowerCase())
  );
}

function fetchBlogPost(blogId) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'nexa-terminal-api-production-74cc.up.railway.app',
      port: 443,
      path: `/api/blog/${blogId}`,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

function stripHtml(html) {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').substring(0, 155);
}

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

function generateHTML({ title, description, image, url }) {
  return `<!DOCTYPE html>
<html lang="mk">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />

  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}" />

  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="article" />
  <meta property="og:url" content="${escapeHtml(url)}" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:image" content="${escapeHtml(image)}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:site_name" content="Nexa Terminal" />
  <meta property="og:locale" content="mk_MK" />

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:url" content="${escapeHtml(url)}" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <meta name="twitter:image" content="${escapeHtml(image)}" />
  <meta name="twitter:site" content="@NexaTerminal" />

  <!-- Redirect to actual page -->
  <meta http-equiv="refresh" content="0; url=${escapeHtml(url)}" />
</head>
<body>
  <h1>Nexa Terminal</h1>
  <p>Препраќање...</p>
</body>
</html>`;
}

module.exports = async (req, res) => {
  const userAgent = req.headers['user-agent'] || '';
  const { id } = req.query;

  // For non-crawler requests, serve the React app
  if (!isCrawler(userAgent)) {
    // Read and serve the index.html from the build folder
    const fs = require('fs');
    const path = require('path');
    try {
      const indexPath = path.join(__dirname, '..', 'build', 'index.html');
      const html = fs.readFileSync(indexPath, 'utf-8');
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.send(html);
    } catch (error) {
      // Fallback: redirect to home and let client-side routing handle it
      return res.redirect(307, '/');
    }
  }

  try {
    const post = await fetchBlogPost(id);

    if (!post || !post._id) {
      return res.status(404).send('Blog post not found');
    }

    const metaDescription = stripHtml(post.excerpt || post.title);
    const imageUrl = post.featuredImage || 'https://nexa.mk/nexa-logo-navbar.png';
    const fullImageUrl = imageUrl.startsWith('http') ? imageUrl : `https://nexa.mk${imageUrl}`;

    const html = generateHTML({
      title: `${post.title} | Nexa Terminal`,
      description: metaDescription,
      image: fullImageUrl,
      url: `https://nexa.mk/blog/${id}`
    });

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
    return res.send(html);
  } catch (error) {
    console.error('Error fetching blog post:', error);
    return res.redirect(307, `/blog/${id}`);
  }
};
