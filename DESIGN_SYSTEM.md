# Nexa Network Design System & Style Guide

## 🎯 Overview
This document defines the comprehensive design system for the Nexa Network of websites. Every website in the network MUST follow these exact specifications to maintain visual consistency and brand identity across all domains.

**Primary Website:** topics.nexa.mk (Legal Topics Platform)  
**Network Concept:** Multiple specialized content platforms with identical design, different functionality and content.

## 🎨 Color Palette

### Primary Colors
```css
/* Primary Blue - Main brand color */
--color-primary: #1E4DB7;
--color-primary-50: #F0F7FF;
--color-primary-100: #E0EEFF;
--color-primary-200: #C7E2FF;
--color-primary-300: #A5D2FF;
--color-primary-400: #7BB8FF;
--color-primary-500: #1E4DB7;
--color-primary-600: #1A44A3;
--color-primary-700: #163A8F;
--color-primary-800: #13317A;
--color-primary-900: #0F2766;
```

### Neutral Colors
```css
/* Neutral Scale - For text and backgrounds */
--color-neutral-50: #FAFAFA;
--color-neutral-100: #F5F5F5;
--color-neutral-200: #E5E5E5;
--color-neutral-300: #D4D4D4;
--color-neutral-400: #A3A3A3;
--color-neutral-500: #737373;
--color-neutral-600: #525252;
--color-neutral-700: #404040;
--color-neutral-800: #262626;
--color-neutral-900: #171717;
```

### Semantic Colors
```css
/* Green for success states */
--color-green-100: #DCFCE7;
--color-green-500: #22C55E;
--color-green-700: #15803D;

/* Orange for warnings */
--color-orange-100: #FFEDD5;
--color-orange-500: #F97316;
--color-orange-700: #C2410C;
```

## 📝 Typography

### Font Family
- **Primary Font:** Inter (system font fallback: system-ui, sans-serif)
- **Font Smoothing:** Always use `-webkit-font-smoothing: antialiased`

### Font Sizes & Weights
```css
/* Headings */
h1: text-4xl lg:text-6xl font-bold (36px/60px mobile/desktop)
h2: text-3xl lg:text-4xl font-bold (30px/36px mobile/desktop)
h3: text-2xl font-bold (24px)
h4: text-xl font-bold (20px)

/* Body Text */
Large: text-xl lg:text-2xl (20px/24px mobile/desktop)
Regular: text-base (16px)
Small: text-sm (14px)
Extra Small: text-xs (12px)

/* Font Weights */
Regular: font-medium (500)
Semibold: font-semibold (600)
Bold: font-bold (700)
```

### Text Colors
- **Primary Text:** `text-neutral-900` (headings)
- **Secondary Text:** `text-neutral-700` (body)
- **Tertiary Text:** `text-neutral-600` (supporting)
- **Muted Text:** `text-neutral-500` (captions)
- **Brand Text:** `text-primary` (links, CTAs)

## 🏗️ Layout Structure

### Page Layout Pattern
```html
<!-- All pages MUST follow this structure -->
<main>
  <!-- Hero Section with Background -->
  <section class="relative py-16 lg:py-24 overflow-hidden">
    <!-- Background Image (if applicable) -->
    <div class="absolute inset-0">
      <Image src="[corporate-background]" />
      <div class="absolute inset-0 bg-white/85"></div>
    </div>
    
    <!-- Content -->
    <div class="relative container mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-16">
        <div class="max-w-4xl mx-auto">
          <h1 class="gradient-heading">Page Title</h1>
          <p class="text-xl lg:text-2xl text-neutral-700 mb-8 leading-relaxed">
            Subtitle description
          </p>
          <!-- Navigation/Filters (if applicable) -->
        </div>
      </div>
    </div>
  </section>
  
  <!-- Main Content Section -->
  <section class="py-8">
    <div class="container mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Page content -->
    </div>
  </section>
</main>
```

### Container Specifications
- **Container:** `container mx-auto px-4 sm:px-6 lg:px-8`
- **Max Width:** Automatic container with responsive padding
- **Content Width:** `max-w-4xl mx-auto` for text-heavy sections

## 🎨 Visual Design Patterns

### Gradient Headings
```css
.gradient-heading {
  @apply text-4xl lg:text-6xl font-bold bg-gradient-to-r from-neutral-900 via-primary to-neutral-700 bg-clip-text text-transparent mb-6;
}
```

### Background Images
- **Hero Backgrounds:** Corporate office/business imagery from Unsplash
- **Overlay:** Always use `bg-white/85` (85% white opacity)
- **Image Sizing:** `fill object-cover priority` for hero images

### Card Design
```css
/* Standard Card */
.modern-card {
  @apply bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-neutral-100 hover:border-primary/20 hover:-translate-y-1;
}

/* Content Card */
.content-card {
  @apply bg-white rounded-xl border border-gray-200 shadow-sm;
}
```

## 🔘 Interactive Elements

### Button Styles
```css
/* Primary Button */
.btn-primary {
  @apply inline-flex items-center justify-center px-8 py-4 bg-primary text-white rounded-2xl font-bold text-lg hover:bg-primary-600 transition-all duration-300 hover:scale-105 shadow-modern;
}

/* Link-Style Navigation */
.nav-link {
  @apply font-medium text-lg transition-colors duration-200 text-neutral-600 hover:text-primary;
}

/* Active Navigation Link */
.nav-link-active {
  @apply text-primary font-semibold;
}
```

### Navigation Patterns
- **Category Filters:** Clean text links without backgrounds
- **Format:** "Category Name (count)" for filters
- **Layout:** Single row with `flex justify-center gap-8 flex-wrap`
- **No icons or decorative elements**

## 🎭 Animation & Transitions

### Standard Animations
```css
/* Fade In Up */
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Hover Lift */
.hover-lift:hover {
  transform: translateY(-8px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
}

/* Standard Transitions */
.transition-standard {
  @apply transition-all duration-300;
}
```

### Animation Usage Rules
- **Hover Effects:** 300ms duration for all hover states
- **Card Interactions:** Scale and shadow changes
- **Text Links:** Color transitions only
- **No complex animations** unless specifically required

## 📱 Responsive Design

### Breakpoints (Tailwind CSS)
- **Mobile:** Default (< 640px)
- **Small:** `sm:` (≥ 640px)
- **Medium:** `md:` (≥ 768px)
- **Large:** `lg:` (≥ 1024px)
- **Extra Large:** `xl:` (≥ 1280px)

### Grid Patterns
```css
/* Standard Content Grid */
.content-grid {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8;
}

/* Two Column Layout */
.two-column {
  @apply grid grid-cols-1 lg:grid-cols-3 gap-8;
}

/* Author Section Ratio (2:1) */
.author-layout {
  @apply lg:col-span-2; /* Content: 2 parts */
  @apply lg:col-span-1; /* Author: 1 part */
}
```

### Mobile-First Approach
- Always design for mobile first
- Use responsive typography scaling
- Ensure touch-friendly interactive elements (min 44px)
- Test horizontal scrolling on small screens

## 🖼️ Image Guidelines

### Image Specifications
- **Hero Images:** 2070x1380px minimum, corporate/business theme
- **Content Images:** 480x320px for cards, 400x250px for thumbnails
- **Author Photos:** 190x190px (square aspect ratio)
- **Format:** WebP preferred, JPG fallback
- **Quality:** 80% compression for balance of quality/performance

### Image Sources
- **Primary:** Unsplash (business, corporate, professional themes)
- **Style:** Modern, clean, professional business environments
- **Colors:** Neutral tones that work with brand colors

## 📋 Component Specifications

### Header/Navigation
- **No logo in header** (removed for clean design)
- **Navigation:** Text-based links with hover states
- **Background:** Transparent or minimal
- **Mobile:** Hamburger menu pattern

### Footer
- **No logo** (simplified design)
- **Background:** Business gradient
- **Content:** Contact info, quick links, newsletter signup
- **Colors:** White text on gradient background

### Content Sections
```css
/* Section Spacing */
.section-spacing {
  @apply py-16 lg:py-24;
}

/* Content Spacing */
.content-spacing {
  @apply mb-8;
}

/* Text Spacing */
.text-spacing {
  @apply mb-4 leading-relaxed;
}
```

## 🎨 Background Patterns

### Hero Section Backgrounds
```css
/* Corporate Background Pattern */
.hero-background {
  position: relative;
  background-image: url('[corporate-office-unsplash-image]');
  background-size: cover;
  background-position: center;
}

.hero-background::after {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.85);
}
```

### Gradient Backgrounds
```css
/* Business Gradient */
.bg-business-gradient {
  background: linear-gradient(135deg, #1E4DB7 0%, #3B82F6 50%, #06B6D4 100%);
}

/* Hero Overlay */
.bg-hero-overlay {
  background: linear-gradient(135deg, rgba(30, 77, 183, 0.9) 0%, rgba(59, 130, 246, 0.8) 50%, rgba(6, 182, 212, 0.7) 100%);
}
```

## 🔍 Content Patterns

### Disclaimer Section
```html
<!-- Legal Disclaimer (required on content pages) -->
<div class="bg-neutral-50 rounded-xl p-8 border-l-4 border-primary">
  <div class="flex items-start space-x-4">
    <div class="flex-shrink-0">
      <div class="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center">
        <span class="text-primary text-lg">⚖️</span>
      </div>
    </div>
    <div class="flex-1">
      <h3 class="text-lg font-semibold text-neutral-900 mb-3">
        Important Notice
      </h3>
      <div class="prose prose-neutral max-w-none">
        <!-- Disclaimer content -->
      </div>
    </div>
  </div>
</div>
```

### Author Profile Section
```html
<!-- Author Section with Neutral Background -->
<div class="bg-neutral-300/30 text-neutral-800 rounded-xl p-8">
  <div class="flex flex-col items-center text-center">
    <div class="relative mb-6">
      <Image width={190} height={190} class="w-48 h-48 rounded-2xl object-cover border-4 border-white" />
    </div>
    <div class="mb-6">
      <h4 class="text-xl font-bold text-neutral-800 mb-2">Author Name</h4>
      <p class="text-neutral-600 font-semibold mb-1">Title</p>
      <p class="text-neutral-500 font-medium">Company</p>
    </div>
  </div>
  <!-- Bio and contact info -->
</div>
```

## 📊 Content Layout Patterns

### Homepage Carousel
```html
<!-- Horizontal Auto-Sliding Carousel -->
<div class="relative overflow-hidden mb-8">
  <div class="flex animate-auto-slide">
    <!-- Cards with 20% increased width (w-96) -->
    <div class="flex-shrink-0 w-96 mx-3">
      <!-- Card content with h-64 images -->
    </div>
  </div>
</div>
```

### Q&A Section
```html
<!-- Accordion-style Q&A -->
<Accordion.Root type="single" collapsible class="space-y-4">
  <Accordion.Item class="bg-white rounded-xl border border-gray-200 shadow-sm card-hover">
    <!-- Accordion content -->
  </Accordion.Item>
</Accordion.Root>
```

## 🛠️ Technical Specifications

### Framework & Dependencies
- **Framework:** Next.js 15.4.6 with Pages Router
- **Styling:** Tailwind CSS 4.x
- **Components:** Radix UI primitives
- **Icons:** Lucide React
- **Images:** Next.js Image component with optimization
- **Fonts:** Inter from Google Fonts

### CSS Architecture
```css
/* Global Styles */
:root {
  --background: #ffffff;
  --foreground: #333333;
  /* Color variables defined above */
}

/* Smooth scroll */
html { scroll-behavior: smooth; }

/* Focus styles */
*:focus-visible {
  outline: 2px solid var(--color-primary-500);
  outline-offset: 2px;
}
```

### Performance Requirements
- **Image optimization:** Always use Next.js Image component
- **Font loading:** Preload Inter font family
- **Animations:** Use CSS transforms for better performance
- **Bundle size:** Monitor and optimize for Core Web Vitals

## 🌐 Internationalization (i18n)

### Language Support
- **Primary:** English (en)
- **Secondary:** Macedonian (mk)
- **Implementation:** Next.js built-in i18n

### Text Content Rules
```typescript
// All text must support both languages
const content = {
  en: "English content",
  mk: "Македонски содржај"
}

// Usage pattern
{locale === 'en' ? content.en : content.mk}
```

## 📱 Form Design

### Form Styling
```css
/* Standard Form Input */
.form-input {
  @apply w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent;
}

/* Form Button */
.form-button {
  @apply w-full px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary-600 transition-colors;
}
```

### Form Integration
- **Service:** Formspree for email handling
- **Method:** FormData (not JSON) for submissions
- **Fields:** Always include page tracking information

## 🎯 Brand Voice & Content

### Content Tone
- **Professional** but approachable
- **Expert-focused** content delivery
- **Clear and concise** communication
- **Diplomatic** language for sensitive topics

### Content Structure
1. **Hero section** with clear value proposition
2. **Navigation/filtering** for content discovery
3. **Content grid** with expert information
4. **Call-to-action** sections
5. **Footer** with contact and links

## ✅ Implementation Checklist

When implementing this design system on a new website:

### Required Elements
- [ ] Exact color palette implementation
- [ ] Inter font family with proper loading
- [ ] Hero section with corporate background
- [ ] Gradient headings with specified classes
- [ ] Clean navigation without complex styling
- [ ] Modern card designs with hover effects
- [ ] Responsive grid layouts
- [ ] Author profile sections (if applicable)
- [ ] Legal disclaimer sections (if applicable)
- [ ] Footer without logo
- [ ] Proper animation and transition timings

### Technical Requirements
- [ ] Next.js 15.4.6 with Pages Router
- [ ] Tailwind CSS 4.x configuration
- [ ] i18n setup for bilingual support
- [ ] Image optimization with Next.js Image
- [ ] Formspree integration for forms
- [ ] ESLint and TypeScript strict mode
- [ ] Responsive design testing

### Content Requirements
- [ ] Professional copywriting in brand voice
- [ ] High-quality corporate imagery
- [ ] Expert profiles with proper information
- [ ] Legal disclaimers where appropriate
- [ ] SEO optimization with meta tags
- [ ] Bilingual content preparation

## 🎨 Design Tokens Summary

```css
/* Quick Reference */
:root {
  /* Spacing */
  --spacing-xs: 0.5rem;    /* 8px */
  --spacing-sm: 1rem;      /* 16px */
  --spacing-md: 1.5rem;    /* 24px */
  --spacing-lg: 2rem;      /* 32px */
  --spacing-xl: 3rem;      /* 48px */
  
  /* Border Radius */
  --radius-sm: 0.5rem;     /* 8px */
  --radius-md: 0.75rem;    /* 12px */
  --radius-lg: 1rem;       /* 16px */
  --radius-xl: 1.5rem;     /* 24px */
  
  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
  --shadow-modern: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}
```

## 📞 Support & Maintenance

This design system ensures 100% visual consistency across all Nexa Network websites. When implementing on new domains:

1. **Copy this exact design system**
2. **Adapt only the content and domain-specific functionality**
3. **Never modify colors, fonts, or layout patterns**
4. **Test across all responsive breakpoints**
5. **Validate accessibility compliance**

For questions or clarifications about this design system, refer to the topics.nexa.mk implementation as the source of truth.

---

**Last Updated:** January 2025  
**Version:** 1.0  
**Maintained by:** Nexa Network Development Team