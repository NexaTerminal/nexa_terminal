// Vercel function for company one-pagers (/f/:slug).
//  - Link-preview bots (LinkedIn, WhatsApp, Viber, Slack, Telegram, X…) and AI
//    crawlers (GPTBot, ClaudeBot, PerplexityBot…) get server-rendered HTML with
//    the company's title, description, cover image, JSON-LD and page text.
//  - People get the normal React app (build/index.html).
const https = require('https');
const fs = require('fs');
const path = require('path');

const SITE = 'https://nexa.mk';
const API_HOST = 'nexa-terminal-api-production-74cc.up.railway.app';
const BOTS = [
  'facebookexternalhit', 'facebot', 'linkedinbot', 'twitterbot', 'whatsapp', 'viber', 'telegrambot',
  'slackbot', 'discordbot', 'skypeuripreview', 'pinterest', 'redditbot', 'embedly', 'applebot',
  'gptbot', 'oai-searchbot', 'chatgpt-user', 'claudebot', 'claude-searchbot', 'claude-user',
  'perplexitybot', 'perplexity-user', 'ccbot', 'bingbot', 'duckduckbot', 'yandex',
];
const isBot = (ua = '') => BOTS.some((b) => ua.toLowerCase().includes(b));
const esc = (s = '') => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const abs = (u = '') => (!u ? '' : u.startsWith('http') ? u : `${SITE}${u}`);

function fetchProfile(slug) {
  return new Promise((resolve) => {
    const req = https.request(
      { hostname: API_HOST, port: 443, path: `/api/public/profile/${encodeURIComponent(slug)}`, method: 'GET', timeout: 4000 },
      (res) => {
        let data = '';
        res.on('data', (c) => { data += c; });
        res.on('end', () => {
          if (res.statusCode !== 200) return resolve(null);
          try { resolve(JSON.parse(data).profile || null); } catch { resolve(null); }
        });
      }
    );
    req.on('timeout', () => { req.destroy(); resolve(null); });
    req.on('error', () => resolve(null));
    req.end();
  });
}

function serveApp(res) {
  try {
    const html = fs.readFileSync(path.join(__dirname, '..', 'build', 'index.html'), 'utf-8');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.send(html);
  } catch {
    return res.redirect(307, '/');
  }
}

function renderProfile(p) {
  const url = `${SITE}/f/${p.slug}`;
  const title = `${p.displayName}${p.city ? ` — ${p.city}` : ''}`;
  const description = (p.headline || p.about || p.displayName).slice(0, 160);
  const image = abs(p.coverUrl || p.avatarUrl) || `${SITE}/nexa-blog-share-v2.png`;
  const [w, h] = p.coverUrl ? [1600, 900] : p.avatarUrl ? [512, 512] : [1200, 630];
  const sameAs = [p.website, p.links?.linkedin, p.links?.facebook, p.links?.instagram].filter(Boolean);
  const ld = {
    '@context': 'https://schema.org', '@type': 'ProfilePage', url, name: p.displayName, inLanguage: 'mk',
    mainEntity: {
      '@type': 'Organization', '@id': `${url}#organization`, name: p.displayName, url,
      ...(p.about || p.headline ? { description: p.about || p.headline } : {}),
      ...(p.avatarUrl ? { logo: abs(p.avatarUrl) } : {}),
      image,
      ...(p.city ? { address: { '@type': 'PostalAddress', addressLocality: p.city, addressCountry: 'MK' } } : {}),
      ...(p.contactEmail ? { email: p.contactEmail } : {}),
      ...(p.phone ? { telephone: p.phone } : {}),
      ...(sameAs.length ? { sameAs } : {}),
      ...(p.offers?.length ? { makesOffer: p.offers.map((o) => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name: o } })) } : {}),
    },
  };
  const list = (items) => `<ul>${items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`;
  return `<!DOCTYPE html>
<html lang="mk">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}" />
  <meta name="robots" content="${p.indexable ? 'index, follow, max-image-preview:large' : 'noindex, follow'}" />
  <link rel="canonical" href="${url}" />
  <meta property="og:type" content="profile" />
  <meta property="og:site_name" content="Nexa" />
  <meta property="og:url" content="${url}" />
  <meta property="og:title" content="${esc(title)}" />
  <meta property="og:description" content="${esc(description)}" />
  <meta property="og:image" content="${esc(image)}" />
  <meta property="og:image:width" content="${w}" />
  <meta property="og:image:height" content="${h}" />
  <meta property="og:image:alt" content="${esc(p.displayName)}" />
  <meta property="og:locale" content="mk_MK" />
  <meta name="twitter:card" content="${p.coverUrl ? 'summary_large_image' : 'summary'}" />
  <meta name="twitter:title" content="${esc(title)}" />
  <meta name="twitter:description" content="${esc(description)}" />
  <meta name="twitter:image" content="${esc(image)}" />
  <script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>
</head>
<body>
  <main>
    <h1>${esc(p.displayName)}</h1>
    ${p.headline ? `<p>${esc(p.headline)}</p>` : ''}
    ${p.city ? `<p>${esc(p.city)}, Македонија</p>` : ''}
    ${p.about ? `<h2>За нас</h2><p>${esc(p.about)}</p>` : ''}
    ${p.offers?.length ? `<h2>Што нудиме</h2>${list(p.offers)}` : ''}
    ${p.lookingFor?.length ? `<h2>Бараме</h2>${list(p.lookingFor)}` : ''}
    <h2>Контакт</h2>
    <ul>
      ${p.contactEmail ? `<li>Е-пошта: <a href="mailto:${esc(p.contactEmail)}">${esc(p.contactEmail)}</a></li>` : ''}
      ${p.phone ? `<li>Телефон: ${esc(p.phone)}</li>` : ''}
      ${p.website ? `<li>Веб-страница: <a href="${esc(p.website)}">${esc(p.website)}</a></li>` : ''}
      <li><a href="${url}#kontakt">Испратете порака</a></li>
    </ul>
    <p><a href="${SITE}/">Профил на Nexa</a></p>
  </main>
</body>
</html>`;
}

module.exports = async (req, res) => {
  const slug = String(req.query.slug || '').slice(0, 120);
  if (!isBot(req.headers['user-agent'] || '') || !slug) return serveApp(res);
  const profile = await fetchProfile(slug);
  if (!profile) return serveApp(res);
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=600, s-maxage=600');
  return res.send(renderProfile(profile));
};

module.exports.renderProfile = renderProfile;
module.exports.isBot = isBot;
