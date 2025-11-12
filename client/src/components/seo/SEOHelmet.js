import { Helmet } from 'react-helmet-async';

export default function SEOHelmet({
  title,
  description,
  keywords,
  canonical,
  ogImage = '/og-default.png',
  type = 'website',
  locale = 'mk_MK'
}) {
  const siteUrl = 'https://nexa.mk';
  const fullTitle = title || 'Nexa Terminal - Автоматизација на правни документи';
  const fullUrl = `${siteUrl}${canonical}`;

  // Handle image URL - use absolute URL if it starts with http, otherwise prepend siteUrl
  const fullImageUrl = ogImage.startsWith('http') ? ogImage : `${siteUrl}${ogImage}`;

  return (
    <Helmet>
      {/* Basic Meta */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <link rel="canonical" href={fullUrl} />

      {/* Additional SEO Meta Tags */}
      <meta name="robots" content="index, follow" />
      <meta name="language" content="Macedonian" />
      <meta property="og:site_name" content="Nexa Terminal" />

      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:image" content={fullImageUrl} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:locale" content={locale} />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullImageUrl} />
      <meta name="twitter:site" content="@NexaTerminal" />

      {/* hreflang for bilingual */}
      <link rel="alternate" hreflang="mk" href={`${siteUrl}${canonical}`} />
      <link rel="alternate" hreflang="en" href={`${siteUrl}/en${canonical}`} />
    </Helmet>
  );
}
