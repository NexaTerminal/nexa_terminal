import { Helmet } from 'react-helmet-async';
import { NEXA_ORG } from './schemaGraph';

// One canonical Organization entity (same @id as every other page) — Nexa is
// a software + consulting company, not a law firm, so no LegalService type.
export function OrganizationSchema() {
  const schema = NEXA_ORG;

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>
    </Helmet>
  );
}

export function ArticleSchema({ title, description, date, image, author = 'Nexa Terminal' }) {
  // Ensure absolute URL for image
  const fullImageUrl = image && image.startsWith('http') ? image : `https://nexa.mk${image || '/nexa-logo-navbar.png'}`;

  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": title,
    "description": description,
    "image": fullImageUrl,
    "datePublished": date,
    "dateModified": date,
    "author": {
      "@type": "Person",
      "name": author
    },
    "publisher": {
      "@type": "Organization",
      "name": "Nexa Terminal",
      "logo": {
        "@type": "ImageObject",
        "url": "https://nexa.mk/nexa-logo-navbar.png"
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://nexa.mk/blog`
    }
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>
    </Helmet>
  );
}

export function FAQSchema({ questions }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": questions.map(q => ({
      "@type": "Question",
      "name": q.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": q.answer
      }
    }))
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>
    </Helmet>
  );
}
