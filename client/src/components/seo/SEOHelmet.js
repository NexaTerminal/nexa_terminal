import { Helmet } from 'react-helmet-async';
import { getStorefront } from '../../lib/storefront';

const SITE_URL = 'https://nexa.mk';
const LEADS_URL = 'https://leads.nexa.mk';
// Canonical/OG host follows the active storefront so the two products don't
// cannibalize each other in search (de-merge Phase 3).
const isLeads = () => getStorefront() === 'leads';
const activeSiteUrl = () => (isLeads() ? LEADS_URL : SITE_URL);
// Per-product brand defaults so leads.nexa.mk sub-pages (contact, blog, login)
// that don't pass explicit meta don't render the SMB brand. Explicit props win.
const DEFAULT_TITLE = {
  main:  'Nexa — Деловниот екосистем за Северна Македонија',
  leads: 'Nexa за правници — нови клиенти од нашата мрежа'
};
const DEFAULT_SITE_NAME = { main: 'Nexa', leads: 'Nexa за правници' };

export default function SEOHelmet({
  title,
  description,
  keywords,
  canonical = '/',
  ogImage = '/nexa-blog-share.png',
  type = 'website',
  locale = 'mk_MK',
  altLocale = 'en_US',
  jsonLd = [],
  noIndex = false,
  hreflangPath
}) {
  const leads = isLeads();
  const baseUrl = activeSiteUrl();
  const fullTitle = title || (leads ? DEFAULT_TITLE.leads : DEFAULT_TITLE.main);
  const fullUrl = `${baseUrl}${canonical}`;
  const fullImageUrl = ogImage.startsWith('http') ? ogImage : `${baseUrl}${ogImage}`;
  const hreflangBase = hreflangPath || canonical;
  const blocks = Array.isArray(jsonLd) ? jsonLd : [jsonLd];

  return (
    <Helmet>
      <html lang={locale.startsWith('mk') ? 'mk' : 'en'} />
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <link rel="canonical" href={fullUrl} />
      <meta name="robots" content={noIndex ? 'noindex, nofollow' : 'index, follow'} />
      <meta name="geo.region" content="MK" />
      <meta name="geo.placename" content="Skopje" />

      <meta property="og:site_name" content={leads ? DEFAULT_SITE_NAME.leads : DEFAULT_SITE_NAME.main} />
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:image" content={fullImageUrl} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:locale" content={locale} />
      <meta property="og:locale:alternate" content={altLocale} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullImageUrl} />

      <link rel="alternate" hrefLang="mk" href={`${baseUrl}${hreflangBase}`} />
      <link rel="alternate" hrefLang="en" href={`${baseUrl}${hreflangBase}?lang=en`} />
      <link rel="alternate" hrefLang="x-default" href={`${baseUrl}${hreflangBase}`} />

      {blocks.filter(Boolean).map((block, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(block)}
        </script>
      ))}
    </Helmet>
  );
}

export { SITE_URL };
