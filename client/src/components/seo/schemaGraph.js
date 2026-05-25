// Canonical schema.org JSON-LD builders for the Nexa public surface.
// Operator entity strings come from PROMPT_brand_seo_geo_legal_unification.md §E.0.

export const NEXA_ORG = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': 'https://nexa.mk/#organization',
  name: 'Nexa',
  legalName: 'Company for Services NEKSA AMD DOOEL Skopje',
  url: 'https://nexa.mk',
  logo: 'https://nexa.mk/nexa-logo-navbar.png',
  email: 'info@nexa.mk',
  telephone: '+389-78-534-258',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Bulevar Partizanski Odredi 102/2-14',
    addressLocality: 'Skopje – Karposh',
    addressRegion: 'Karposh',
    addressCountry: 'MK'
  },
  sameAs: [
    'https://samodaprasham.mk',
    'https://immigration.mk',
    'https://macedoniancitizenship.mk',
    'https://company.nexa.mk',
    'https://iplaw.nexa.mk',
    'https://topics.nexa.mk'
  ]
};

export const NEXA_WEBSITE = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': 'https://nexa.mk/#website',
  url: 'https://nexa.mk',
  name: 'Nexa',
  publisher: { '@id': 'https://nexa.mk/#organization' },
  inLanguage: ['mk', 'en']
};

export const webPage = ({ url, name, description, language = 'mk' }) => ({
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  '@id': `${url}#webpage`,
  url,
  name,
  description,
  inLanguage: language,
  isPartOf: { '@id': 'https://nexa.mk/#website' },
  publisher: { '@id': 'https://nexa.mk/#organization' }
});

export const faqPage = (items) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: items.map(({ q, a }) => ({
    '@type': 'Question',
    name: q,
    acceptedAnswer: { '@type': 'Answer', text: a }
  }))
});

export const personMartin = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  '@id': 'https://nexa.mk/about#martin',
  name: 'Martin Boshkoski',
  jobTitle: 'Founder',
  worksFor: { '@id': 'https://nexa.mk/#organization' },
  email: 'info@nexa.mk'
};

export const superUserService = (language = 'mk') => ({
  '@context': 'https://schema.org',
  '@type': 'Service',
  name: language === 'mk' ? 'Nexa Super User членство' : 'Nexa Super User membership',
  serviceType: 'Professional distribution membership',
  provider: { '@id': 'https://nexa.mk/#organization' },
  areaServed: { '@type': 'Country', name: 'North Macedonia' },
  audience: { '@type': 'BusinessAudience', audienceType: 'Lawyers, accountants, consultants' },
  offers: [
    { '@type': 'Offer', name: 'Monthly',   price: '5000',  priceCurrency: 'MKD', url: 'https://nexa.mk/pricing' },
    { '@type': 'Offer', name: 'Quarterly', price: '12000', priceCurrency: 'MKD', url: 'https://nexa.mk/pricing' },
    { '@type': 'Offer', name: 'Annual',    price: '42000', priceCurrency: 'MKD', url: 'https://nexa.mk/pricing' }
  ]
});

export const terminalProduct = (language = 'mk') => ({
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: 'Nexa Terminal',
  description: language === 'mk'
    ? 'SaaS платформа за автоматизација на документи, AI помош и проверки за усогласеност.'
    : 'SaaS platform for document automation, AI assistance, and compliance health checks.',
  brand: { '@type': 'Brand', name: 'Nexa' },
  offers: { '@type': 'Offer', price: '2500', priceCurrency: 'MKD', url: 'https://nexa.mk/pricing' }
});

export const contactPage = ({ url, language = 'mk' }) => ({
  '@context': 'https://schema.org',
  '@type': 'ContactPage',
  url,
  inLanguage: language,
  isPartOf: { '@id': 'https://nexa.mk/#website' }
});

export const breadcrumb = (items) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((it, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: it.name,
    item: it.url
  }))
});
