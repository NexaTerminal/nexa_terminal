import { Helmet } from 'react-helmet-async';

const SITE_URL = 'https://nexa.mk';

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
  const fullTitle = title || 'Nexa — Деловниот екосистем за Северна Македонија';
  const fullUrl = `${SITE_URL}${canonical}`;
  const fullImageUrl = ogImage.startsWith('http') ? ogImage : `${SITE_URL}${ogImage}`;
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

      <meta property="og:site_name" content="Nexa" />
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

      <link rel="alternate" hrefLang="mk" href={`${SITE_URL}${hreflangBase}`} />
      <link rel="alternate" hrefLang="en" href={`${SITE_URL}${hreflangBase}?lang=en`} />
      <link rel="alternate" hrefLang="x-default" href={`${SITE_URL}${hreflangBase}`} />

      {blocks.filter(Boolean).map((block, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(block)}
        </script>
      ))}
    </Helmet>
  );
}

export { SITE_URL };
