#!/usr/bin/env node
/**
 * Post-build SEO/GEO prerender — no headless browser (react-snap broke the
 * Vercel build before, see commit b4b3d2d).
 *
 * For every public route it writes build/<route>/index.html containing:
 *   - route-specific <title>, description, canonical, robots, Open Graph,
 *     Twitter, hreflang and JSON-LD (all tagged data-rh="true", so
 *     react-helmet-async REPLACES them at runtime instead of duplicating);
 *   - the page's real text as semantic HTML inside #root (#seo-shell), so
 *     crawlers that don't run JavaScript (GPTBot, ClaudeBot, PerplexityBot…)
 *     can read and cite it. React replaces it on mount; it only fades in if
 *     JS hasn't rendered within ~1s, so normal visitors never see it.
 * It also generates build/sitemap.xml (with hreflang alternates) and
 * build/llms-full.txt (full Markdown text of the key pages).
 *
 * Content sources are the same files the React pages render from:
 *   src/data/services/*  ·  src/i18n/locales/website/mk.json
 * Pages whose copy lives inline in JSX get title/description/summary from
 * PAGES below — keep those in sync when you edit the page's <SEOHelmet>.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BUILD = path.join(ROOT, 'build');
const SRC = path.join(ROOT, 'src');
const SITE = 'https://nexa.mk';
const TODAY = new Date().toISOString().slice(0, 10);
// Routes that exist in both languages (?lang=en). Others are Macedonian-only
// and get no hreflang alternates.
const BILINGUAL = new Set(['/', '/uslugi', '/contact', '/privacy-policy', '/terms-conditions', '/smetkovoditeli']);
const isBilingual = (p) => BILINGUAL.has(p) || p.startsWith('/uslugi/');
const DEFAULT_OG = { url: `${SITE}/nexa-blog-share-v2.png`, w: 1200, h: 630 };

// ── helpers ────────────────────────────────────────────────────────────
const esc = (s = '') => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const ul = (items) => `<ul>${items.map(i => `<li>${esc(i)}</li>`).join('')}</ul>`;
const dataUrl = (code) => 'data:text/javascript;base64,' + Buffer.from(code).toString('base64');

async function loadServices() {
  const dir = path.join(SRC, 'data/services');
  const indexSrc = await fs.readFile(path.join(dir, 'index.js'), 'utf8');
  const g = (globalThis.__nexaSvc = {});
  const imports = [...indexSrc.matchAll(/^import (\w+) from '\.\/(\w+)';$/gm)];
  for (const [, name, file] of imports) {
    g[name] = (await import(dataUrl(await fs.readFile(path.join(dir, `${file}.js`), 'utf8')))).default;
  }
  const patched = indexSrc.replace(/^import (\w+) from '\.\/\w+';$/gm, 'const $1 = globalThis.__nexaSvc.$1;');
  return import(dataUrl(patched));
}

// ── JSON-LD builders (mirror src/components/seo/schemaGraph.js) ────────
const ORG = {
  '@context': 'https://schema.org', '@type': 'Organization', '@id': `${SITE}/#organization`,
  name: 'Nexa', legalName: 'Company for Services NEKSA AMD DOOEL Skopje', url: SITE,
  logo: `${SITE}/nexa-logo-navbar.png`, email: 'info@nexa.mk', telephone: '+389-78-534-258',
  address: { '@type': 'PostalAddress', streetAddress: 'Bulevar Partizanski Odredi 102/2-14', addressLocality: 'Skopje', addressRegion: 'Karposh', postalCode: '1000', addressCountry: 'MK' },
  areaServed: { '@type': 'Country', name: 'North Macedonia' },
  knowsLanguage: ['mk', 'en'],
};
const WEBSITE = { '@context': 'https://schema.org', '@type': 'WebSite', '@id': `${SITE}/#website`, url: SITE, name: 'Nexa', publisher: { '@id': `${SITE}/#organization` }, inLanguage: ['mk', 'en'] };
const webPage = (url, name, description) => ({ '@context': 'https://schema.org', '@type': 'WebPage', '@id': `${url}#webpage`, url, name, description, inLanguage: 'mk', isPartOf: { '@id': `${SITE}/#website` }, publisher: { '@id': `${SITE}/#organization` }, dateModified: TODAY });
const breadcrumb = (trail) => ({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: trail.map(([name, p], i) => ({ '@type': 'ListItem', position: i + 1, name, item: `${SITE}${p}` })) });
const faqLd = (faq) => ({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) });

// ── route builders ─────────────────────────────────────────────────────
function homeRoute(mk) {
  const h = mk.home;
  const features = [1, 2, 3, 4, 5, 6].map(n => [h[`feature${n}Title`], h[`feature${n}Desc`]]);
  const body = `
<header><h1>${esc(h.heroTitle)}</h1><p>${esc(h.heroSubtitle)}</p>
<p><a href="/login?mode=register">Започнете бесплатно</a> · <a href="/proverka">Бесплатна проверка на усогласеноста</a></p></header>
<section><h2>${esc(h.terminalHeading)}</h2><p>${esc(h.terminalLead)}</p>
${features.map(([t, d]) => `<h3>${esc(t)}</h3><p>${esc(d)}</p>`).join('\n')}</section>
<section id="paketi"><h2>Пакети за Nexa Terminal</h2>
<h3>Основен — бесплатно засекогаш за фирми</h3>${ul(['Автоматизирани документи (над 45 шаблони) и сопствени шаблони', 'AI-асистенти и анализа на договори', 'Проверки на усогласеноста: правна, заштита на лични податоци, даноци, работни односи, сајбер-безбедност', 'Кадровски алатки: евиденција на вработени, проценка на кандидати, интервјуа', 'Деловна социјална мрежа: профил на фирмата, објави и разговори', 'До 3 корисници во фирмата'])}
<h3>Про — по покана, за адвокати</h3><p>Барања од клиенти преку мрежата Nexa, до 25 сметки за клиенти, стручни одговори и блог, професионален профил.</p>
<p>Советувањето и водењето проекти не се дел од пакетите — види <a href="/uslugi">Услуги</a>.</p></section>`;
  return {
    path: '/', title: h.seoTitle, description: h.seoDesc, priority: '1.0', changefreq: 'weekly', body,
    jsonLd: [ORG, WEBSITE, webPage(`${SITE}/`, 'Nexa', h.seoDesc), {
      '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: 'Nexa Terminal',
      applicationCategory: 'BusinessApplication', operatingSystem: 'Web', url: SITE, inLanguage: ['mk', 'en'],
      description: h.terminalLead, publisher: { '@id': `${SITE}/#organization` },
      offers: { '@type': 'Offer', name: 'Основен', price: '0', priceCurrency: 'EUR', description: 'Бесплатно засекогаш за мали и средни фирми', category: 'free' },
      featureList: features.map(([t]) => t),
    }],
    md: `# Nexa — Nexa Terminal\n\n${h.heroSubtitle}\n\n## ${h.terminalHeading}\n\n${h.terminalLead}\n\n${features.map(([t, d]) => `- **${t}** — ${d}`).join('\n')}\n\n## Пакети\n\n- **Основен** — бесплатно засекогаш за мали и средни фирми (документи, AI-асистенти, проверки на усогласеноста, кадровски алатки, деловна социјална мрежа, до 3 корисници).\n- **Про** — по покана, за адвокати.\n`,
  };
}

function hubRoute({ SERVICES, SERVICES_COMMON }) {
  const c = SERVICES_COMMON.mk;
  const url = `${SITE}/uslugi`;
  const body = `
<header><h1>${esc(c.heroTitle)}</h1><p>${esc(c.heroLead)}</p><p><a href="/uslugi#kontakt">${esc(c.heroCta)}</a></p></header>
<section><h2>${esc(c.servicesHeading)}</h2>
${SERVICES.map(s => `<article><h3><a href="/uslugi/${s.slug}">${esc(s.mk.title)}</a></h3><p>${esc(s.mk.short)}</p></article>`).join('\n')}</section>
<section><h2>${esc(c.processHeading)}</h2><ol>${c.process.map(p => `<li><strong>${esc(p.t)}</strong> — ${esc(p.d)}</li>`).join('')}</ol><p>${esc(c.partnersNote)}</p></section>
<section><h2>${esc(c.experienceHeading)}</h2>${c.experience.map(x => `<h3>${esc(x.t)}</h3><p>${esc(x.d)}</p>`).join('')}</section>`;
  return {
    path: '/uslugi', title: c.seoTitle, description: c.seoDesc, priority: '0.9', changefreq: 'monthly', body,
    og: { url: `${SITE}/images/services/hub.jpg`, w: 1600, h: 900, alt: c.navLabel },
    jsonLd: [ORG, webPage(url, c.seoTitle, c.seoDesc), breadcrumb([['Nexa', '/'], [c.navLabel, '/uslugi']]), {
      '@context': 'https://schema.org', '@type': 'ProfessionalService', '@id': `${url}#service`, name: `Nexa — ${c.navLabel}`, url,
      description: c.seoDesc, areaServed: { '@type': 'Country', name: 'North Macedonia' }, availableLanguage: ['mk', 'en'],
      provider: { '@id': `${SITE}/#organization` }, image: `${SITE}/images/services/hub.jpg`,
      hasOfferCatalog: { '@type': 'OfferCatalog', name: c.navLabel, itemListElement: SERVICES.map(s => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name: s.mk.title, description: s.mk.short, url: `${url}/${s.slug}` } })) },
    }],
    md: `# ${c.heroTitle}\n\n${c.heroLead}\n\n${SERVICES.map(s => `- [${s.mk.title}](${url}/${s.slug}) — ${s.mk.short}`).join('\n')}\n\n## ${c.processHeading}\n\n${c.process.map((p, i) => `${i + 1}. **${p.t}** — ${p.d}`).join('\n')}\n\n${c.partnersNote}\n`,
  };
}

function serviceRoute(service, { SERVICES, SERVICES_COMMON }) {
  const c = SERVICES_COMMON.mk;
  const s = service.mk;
  const p = `/uslugi/${service.slug}`;
  const url = `${SITE}${p}`;
  const img = `${SITE}/images/services/${service.slug}.jpg`;
  const others = SERVICES.filter(x => x.slug !== service.slug);
  const body = `
<nav aria-label="breadcrumb"><a href="/">Nexa</a> › <a href="/uslugi">${esc(c.navLabel)}</a> › ${esc(s.title)}</nav>
<header><h1>${esc(s.heroTitle)}</h1><p>${esc(s.heroLead)}</p><p><strong>${esc(s.title)}</strong> — ${esc(s.short)}</p></header>
<section><h2>${esc(c.introHeading)}</h2>${s.intro.map(x => `<p>${esc(x)}</p>`).join('')}</section>
${s.example ? `<section><h2>${esc(c.exampleHeading)}</h2><blockquote>${esc(s.example)}</blockquote><p><em>${esc(c.exampleNote)}</em></p></section>` : ''}
<section><h2>${esc(c.signalsHeading)}</h2>${ul(s.signals)}<h2>${esc(c.forWhomHeading)}</h2>${ul(s.forWhom)}</section>
<section><h2>${esc(c.roadmapHeading)}</h2><p>${esc(c.roadmapNote)}</p><ol>${s.roadmap.map(ph => `<li><h3>${esc(ph.phase)} <small>(${esc(ph.duration)})</small></h3><p>${esc(ph.text)}</p>${ul(ph.activities)}<p><strong>${esc(c.outputLabel)}</strong> ${esc(ph.output)}</p></li>`).join('')}</ol></section>
<section><h2>${esc(c.localHeading)}</h2>${s.localNotes.map(n => `<h3>${esc(n.t)}</h3><p>${esc(n.d)}</p>`).join('')}</section>
<section><h2>${esc(c.mistakesHeading)}</h2><p>${esc(c.mistakesLead)}</p><ol>${s.mistakes.map(m => `<li><strong>${esc(m.t)}</strong> — ${esc(m.d)}</li>`).join('')}</ol></section>
<section><h2>${esc(c.deliverablesHeading)}</h2>${ul(s.deliverables)}<h2>${esc(c.clientDocsHeading)}</h2>${ul(s.clientDocs)}</section>
<section><h2>${esc(c.rolesHeading)}</h2><p>${esc(c.partnersNote)}</p><h3>${esc(c.rolesWe)}</h3>${ul(s.roles.we)}<h3>${esc(c.rolesPartners)}</h3>${ul(s.roles.partners)}<h3>${esc(c.rolesYou)}</h3>${ul(s.roles.you)}</section>
<section><h2>${esc(c.processHeading)}</h2><ol>${c.process.map(x => `<li><strong>${esc(x.t)}</strong> — ${esc(x.d)}</li>`).join('')}</ol></section>
<section><h2>${esc(c.faqHeading)}</h2>${s.faq.map(f => `<h3>${esc(f.q)}</h3><p>${esc(f.a)}</p>`).join('')}</section>
<section><h2>${esc(c.otherServices)}</h2><ul>${others.map(o => `<li><a href="/uslugi/${o.slug}">${esc(o.mk.title)}</a> — ${esc(o.mk.short)}</li>`).join('')}</ul><p><small>${esc(c.disclaimer)}</small></p></section>`;
  const md = [
    `# ${s.title}`, '', `${s.heroTitle} ${s.heroLead}`, '', `URL: ${url}`, '',
    `## ${c.introHeading}`, '', s.intro.join('\n\n'), '',
    s.example ? `## ${c.exampleHeading}\n\n> ${s.example}\n\n_${c.exampleNote}_\n` : '',
    `## ${c.signalsHeading}`, '', s.signals.map(x => `- ${x}`).join('\n'), '',
    `## ${c.forWhomHeading}`, '', s.forWhom.map(x => `- ${x}`).join('\n'), '',
    `## ${c.roadmapHeading}`, '', s.roadmap.map((ph, i) => `${i + 1}. **${ph.phase}** (${ph.duration}) — ${ph.text} ${c.outputLabel} ${ph.output}`).join('\n'), '',
    `## ${c.localHeading}`, '', s.localNotes.map(n => `- **${n.t}** — ${n.d}`).join('\n'), '',
    `## ${c.mistakesHeading}`, '', s.mistakes.map(m => `- **${m.t}** — ${m.d}`).join('\n'), '',
    `## ${c.deliverablesHeading}`, '', s.deliverables.map(x => `- ${x}`).join('\n'), '',
    `## ${c.faqHeading}`, '', s.faq.map(f => `**${f.q}**\n${f.a}`).join('\n\n'), '',
    `_${c.disclaimer}_`, '',
  ].join('\n');
  return {
    path: p, title: `${s.title} · Nexa`, description: s.short, priority: '0.8', changefreq: 'monthly', body, md,
    og: { url: img, w: 1600, h: 900, alt: s.title },
    jsonLd: [ORG, webPage(url, s.title, s.short),
      breadcrumb([['Nexa', '/'], [c.navLabel, '/uslugi'], [s.title, p]]),
      { '@context': 'https://schema.org', '@type': 'Service', '@id': `${url}#service`, name: s.title, serviceType: s.title, description: s.short, url, image: img,
        areaServed: { '@type': 'Country', name: 'North Macedonia' }, availableLanguage: ['mk', 'en'], provider: { '@id': `${SITE}/#organization` } },
      faqLd(s.faq)],
  };
}

// Pages whose copy is inline JSX: keep in sync with each page's <SEOHelmet>.
function simpleRoutes(mk) {
  const PAGES = [
    ['/contact', mk.contact.seoTitle, mk.contact.seoDesc, 'Контакт', '0.6', 'NEKSA AMD DOOEL, Бул. Партизански Одреди 102/2-14, Скопје – Карпош · +389 78 534 258 · info@nexa.mk'],
    ['/login', 'Регистрација и најава · Nexa Terminal', 'Создадете бесплатен профил за Вашата фирма: документи, AI-асистенти, проверки на усогласеноста и деловна социјална мрежа. Бесплатно засекогаш за мали и средни фирми.', 'Регистрација во Nexa Terminal', '0.7'],
    ['/proverka', 'Бесплатна проверка на усогласеност · Nexa', 'Одговорете 15 прашања и дознајте колку Вашата фирма е усогласена со работните односи, личните податоци, безбедноста при работа и повеќе — бесплатно, за 3 минути.', 'Бесплатна проверка на усогласеноста', '0.8'],
    ['/proverka-rabotodavac', 'Станете „Проверен работодавач“ · Nexa', 'Одговорете на околу 18 прашања и добијте значка „Проверен работодавач“ што ја покажува Вашата посветеност на работничките права.', 'Проверен работодавач', '0.6'],
    ['/smetkovoditeli', 'Nexa за сметководители — управувајте ги сите клиенти од едно место', 'Сметководителите ги водат документите, усогласеноста и роковите на сите свои клиенти преку една сметка на Nexa — до 25 клиентски фирми.', 'Nexa за сметководители', '0.6'],
    ['/blog', 'Блог — деловни совети и правни насоки за фирми · Nexa', 'Совети за правни прашања, работни односи, маркетинг и водење бизнис во Македонија.', 'Блог', '0.7'],
    ['/topics', 'Теми — правни прашања и одговори · Nexa', 'Најчести правни прашања и одговори за македонски фирми: работно право, договори, лични податоци, корпоративно право.', 'Правни теми и прашања', '0.5'],
    ['/residence', 'Престој и дозволи за живеење во Македонија · Nexa', 'Водич за дозволи за престој, работни дозволи и документи за странци во Северна Македонија: процедури, рокови и потребни документи.', 'Престој и дозволи за живеење', '0.5'],
    ['/employment', 'Работни односи — договори за вработување и работно право · Nexa', 'Договори за вработување, откажување, права на вработените, годишни одмори и работното законодавство во Македонија.', 'Работни односи', '0.5'],
    ['/trademark', 'Трговска марка — регистрација на жиг во Македонија · Nexa', 'Регистрација на жиг, обновување, меѓународна регистрација и заштита на интелектуалната сопственост во Македонија.', 'Трговска марка', '0.5'],
    ['/corporate', 'Корпоративно право — основање и промени во фирма · Nexa', 'Основање фирма, статут, акционерско друштво, реорганизација, спојување и ликвидација на друштва во Македонија.', 'Корпоративно право', '0.5'],
    ['/privacy-policy', mk.privacy.seoTitle, 'Како Nexa ги собира, користи и заштитува личните податоци на корисниците.', mk.privacy.title, '0.3'],
    ['/terms-conditions', mk.terms.seoTitle, 'Услови за користење на Nexa Terminal и јавните страници на Nexa.', mk.terms.title, '0.3'],
  ];
  return PAGES.map(([p, title, description, h1, priority, extra]) => ({
    path: p, title, description, priority, changefreq: 'monthly',
    body: `<header><h1>${esc(h1)}</h1><p>${esc(description)}</p>${extra ? `<p>${esc(extra)}</p>` : ''}</header>`,
    jsonLd: [ORG, webPage(`${SITE}${p}`, title, description), breadcrumb([['Nexa', '/'], [h1, p]])],
  }));
}

// ── HTML assembly ──────────────────────────────────────────────────────
const SITE_NAV = `<nav aria-label="Nexa"><a href="/">Nexa</a> · <a href="/uslugi">Услуги</a> · <a href="/#paketi">Пакети</a> · <a href="/blog">Блог</a> · <a href="/contact">Контакт</a> · <a href="/login?mode=register">Регистрација</a></nav>`;
const SITE_FOOT = `<footer><p>NEKSA AMD DOOEL — Бул. Партизански Одреди 102/2-14, Скопје – Карпош · +389 78 534 258 · <a href="mailto:info@nexa.mk">info@nexa.mk</a></p><p><a href="/privacy-policy">Политика за приватност</a> · <a href="/terms-conditions">Услови за користење</a></p></footer>`;

function headTags(r) {
  const url = `${SITE}${r.path}`;
  const og = r.og || DEFAULT_OG;
  const sep = r.path.includes('?') ? '&' : '?';
  const t = (tag) => tag.replace(/^<(\w+)/, '<$1 data-rh="true"');
  return [
    `<title>${esc(r.title)}</title>`,
    t(`<meta name="description" content="${esc(r.description)}" />`),
    t(`<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />`),
    t(`<link rel="canonical" href="${url}" />`),
    ...(isBilingual(r.path) ? [
      t(`<link rel="alternate" hreflang="mk" href="${url}" />`),
      t(`<link rel="alternate" hreflang="en" href="${url}${sep}lang=en" />`),
      t(`<link rel="alternate" hreflang="x-default" href="${url}" />`),
    ] : []),
    t(`<meta property="og:type" content="website" />`),
    t(`<meta property="og:site_name" content="Nexa" />`),
    t(`<meta property="og:title" content="${esc(r.title)}" />`),
    t(`<meta property="og:description" content="${esc(r.description)}" />`),
    t(`<meta property="og:url" content="${url}" />`),
    t(`<meta property="og:image" content="${og.url}" />`),
    t(`<meta property="og:image:width" content="${og.w}" />`),
    t(`<meta property="og:image:height" content="${og.h}" />`),
    t(`<meta property="og:image:alt" content="${esc(og.alt || r.title)}" />`),
    t(`<meta property="og:locale" content="mk_MK" />`),
    ...(isBilingual(r.path) ? [t(`<meta property="og:locale:alternate" content="en_US" />`)] : []),
    t(`<meta name="twitter:card" content="summary_large_image" />`),
    t(`<meta name="twitter:title" content="${esc(r.title)}" />`),
    t(`<meta name="twitter:description" content="${esc(r.description)}" />`),
    t(`<meta name="twitter:image" content="${og.url}" />`),
    ...r.jsonLd.map(b => t(`<script type="application/ld+json">${JSON.stringify(b).replace(/</g, '\\u003c')}</script>`)),
  ].join('\n    ');
}

// Strip the template's generic per-page tags; the route block replaces them.
function stripGeneric(html) {
  return html
    .replace(/<title>[\s\S]*?<\/title>/, '')
    .replace(/<meta\s+(name|property)="(description|robots|og:[^"]+|twitter:[^"]+)"[^>]*>/g, '')
    .replace(/<link\s+rel="(canonical|alternate)"[^>]*>/g, '');
}

const SHELL_STYLE = `<style id="seo-shell-style">#seo-shell{max-width:820px;margin:0 auto;padding:40px 20px 64px;font-family:Inter,system-ui,-apple-system,"Segoe UI",sans-serif;color:#1f2937;line-height:1.65;animation:seoShellIn .25s ease 1s both}#seo-shell h1{font-size:2rem;line-height:1.2;color:#0b1220}#seo-shell h2{margin-top:2rem;color:#0b1220}#seo-shell a{color:#1e4db7}@keyframes seoShellIn{from{opacity:0}to{opacity:1}}</style>`;
// Drop the shell synchronously if this HTML is served as the SPA fallback for
// another path (e.g. index.html for /terminal/*), so it never flashes there.
const SHELL_GUARD = (p) => `<script>(function(){var s=document.getElementById('seo-shell');var p=location.pathname.replace(/\\/+$/,'')||'/';if(s&&p!==${JSON.stringify(p)})s.parentNode.removeChild(s);})();</script>`;

function renderPage(template, r) {
  let html = stripGeneric(template)
    .replace(/<html lang="[^"]*"/, '<html lang="mk"')
    .replace('</head>', `    ${headTags(r)}\n    ${SHELL_STYLE}\n  </head>`);
  const shell = `<div id="seo-shell" data-path="${r.path}">${SITE_NAV}<main>${r.body}</main>${SITE_FOOT}</div>`;
  html = html.replace('<div id="root"></div>', `<div id="root">${shell}</div>${SHELL_GUARD(r.path)}`);
  if (!html.includes('id="seo-shell"')) throw new Error(`#root not found in template for ${r.path}`);
  return html;
}

function sitemap(routes) {
  const entry = (loc, r, alts) => `  <url>
    <loc>${esc(loc)}</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>${alts}${r.og && r.og !== DEFAULT_OG ? `
    <image:image><image:loc>${r.og.url}</image:loc><image:title>${esc(r.og.alt || r.title)}</image:title></image:image>` : ''}
  </url>`;
  const urls = [];
  for (const r of routes.filter(x => x.path !== '/login')) {
    const mkUrl = `${SITE}${r.path}`;
    if (!isBilingual(r.path)) { urls.push(entry(mkUrl, r, '')); continue; }
    const enUrl = `${mkUrl}?lang=en`;
    const alts = `
    <xhtml:link rel="alternate" hreflang="mk" href="${esc(mkUrl)}"/>
    <xhtml:link rel="alternate" hreflang="en" href="${esc(enUrl)}"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${esc(mkUrl)}"/>`;
    urls.push(entry(mkUrl, r, alts), entry(enUrl, r, alts));
  }
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls.join('\n')}
</urlset>
`;
}

async function main() {
  const template = await fs.readFile(path.join(BUILD, 'index.html'), 'utf8');
  if (template.includes('id="seo-shell"')) throw new Error('build/index.html already prerendered — run a fresh build first');
  const mk = JSON.parse(await fs.readFile(path.join(SRC, 'i18n/locales/website/mk.json'), 'utf8'));
  const services = await loadServices();

  const routes = [
    homeRoute(mk),
    hubRoute(services),
    ...services.SERVICES.map(s => serviceRoute(s, services)),
    ...simpleRoutes(mk),
  ];

  for (const r of routes) {
    const out = r.path === '/' ? path.join(BUILD, 'index.html') : path.join(BUILD, r.path.slice(1), 'index.html');
    await fs.mkdir(path.dirname(out), { recursive: true });
    await fs.writeFile(out, renderPage(template, r));
  }
  await fs.writeFile(path.join(BUILD, 'sitemap.xml'), sitemap(routes));

  const llmsFull = [
    '# Nexa — full text of key pages', '',
    '> Nexa (NEKSA AMD DOOEL, Skopje) builds Nexa Terminal — free-forever legal, HR and compliance tools plus a business social network for SMEs in North Macedonia — and runs consulting / project-management services for complex deals. Information is general and is not legal advice; legal opinions are issued by licensed partner lawyers.', '',
    `Last updated: ${TODAY}. Primary language: Macedonian (English versions at the same URLs with ?lang=en).`, '',
    ...routes.filter(r => r.md).map(r => `${r.md}\n---\n`),
  ].join('\n');
  await fs.writeFile(path.join(BUILD, 'llms-full.txt'), llmsFull);

  console.log(`seo-prerender: ${routes.length} pages, sitemap.xml, llms-full.txt (${Math.round(llmsFull.length / 1024)} KB)`);
}

main().catch((e) => { console.error('seo-prerender failed:', e); process.exit(1); });
