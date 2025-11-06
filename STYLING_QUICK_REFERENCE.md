# Nexa Terminal Styling - Quick Reference Guide

## Design System Overview

**Location:** `client/src/styles/global.css` (Main design tokens)

**Files:** 54 CSS Module files + 1 global file = 25,676 total lines

---

## Color Palette

### Primary Brand Color (Nexa Blue)
```
--color-primary: #1E4DB7              Main brand
Scale: 50 (#F0F7FF) → 900 (#0F2766)
```

### Neutral Colors (Grays)
```
50-900 scale: #FAFAFA (light) → #171717 (dark)
Common: --color-neutral-100 (#F5F5F5), --color-neutral-600 (#525252)
```

### Semantic Colors
```
Success:  #22C55E (green)      with background #DCFCE7
Warning:  #F97316 (orange)     with background #FFEDD5
Error:    #dc2626 (red)        with background #fef2f2
```

---

## Spacing System

**Base Unit:** 4px (all values are 4px multiples)

```
--spacing-1: 4px       --spacing-3: 12px     --spacing-8: 32px
--spacing-2: 8px       --spacing-4: 16px     --spacing-12: 48px
                       --spacing-6: 24px     --spacing-16+: Large
```

**Aliases:** xs (1), sm (2), md (4), lg (6), xl (8), xxl (12)

---

## Typography

### Font Sizes
```
--font-size-xs: 12px          --font-size-xl: 20px
--font-size-sm: 14px          --font-size-2xl: 24px
--font-size-base: 16px (1rem) --font-size-3xl: 30px
--font-size-lg: 18px          --font-size-4xl: 36px
```

### Font Weights
```
Body:       500 (regular, slightly bold)
Headings:   700 (bold)
Subheads:   600 (semibold)
```

### Line Heights
```
Body:      1.6
Paragraphs: 1.7
Headings:   1.3
```

---

## Shadows (Elevation System)

```
--shadow-xs:   Micro-interactions
--shadow-sm:   Elevated containers
--shadow-md:   Cards, dropdowns
--shadow-lg:   Modals (primary style)
--shadow-xl:   High-elevation modals
--shadow-2xl:  Hero elements
```

---

## Border Radius

```
--border-radius-sm: 2px        --border-radius-xl: 12px
--border-radius-md: 6px        --border-radius-2xl: 16px
--border-radius-lg: 8px        --border-radius-3xl: 24px
--border-radius-full: 9999px   (circular)
```

---

## Transitions

```
--transition-fast: 150ms       (micro-interactions)
--transition-medium: 250ms     (standard UI changes)
--transition-slow: 350ms       (emphasis effects)
Easing: cubic-bezier(0.4, 0, 0.2, 1) [Material Design]
```

---

## Responsive Breakpoints

**Recommended (standardize these):**
```
480px:   Small phones
768px:   Tablets
1024px:  Small laptops
1200px:  Desktop
```

**Currently used:** 480px, 600px, 700px, 768px, 900px, 1024px, 1200px

---

## Common Component Patterns

### Cards
```css
.card {
  background: white;
  border-radius: 16px;           /* use --border-radius-2xl */
  box-shadow: var(--shadow-lg);
  padding: var(--spacing-6);      /* 24px */
  border: 1px solid var(--color-neutral-100);
  transition: all 0.3s ease;
}

.card:hover {
  box-shadow: var(--shadow-2xl);
  transform: translateY(-4px);
  border-color: rgba(30, 77, 183, 0.2);
}
```

### Buttons
```css
button {
  padding: var(--spacing-3) var(--spacing-4);  /* 12px 16px */
  border-radius: var(--border-radius-lg);      /* 8px */
  font-weight: 700;
  transition: all var(--transition-fast);      /* 150ms */
}

button:hover { transform: scale(1.02); }
button:active { transform: scale(0.98); }
button:focus { outline: 2px solid var(--color-primary); }
```

### Form Elements
```css
input, textarea, select {
  padding: var(--spacing-3) var(--spacing-4);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-md);       /* 6px */
  font-size: var(--font-size-base);
  transition: var(--transition-colors);
}

input:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-soft);
}
```

---

## Critical Issues to Fix

### 1. Hardcoded Colors (100+ instances)
**Fix:** Replace with CSS variables
```
#6b7280   → --color-neutral-600
#1f2937   → --color-neutral-800
#f3f4f6   → --color-neutral-100
#fff      → var(--color-white)
```

### 2. Hardcoded Spacing (150+ instances)
**Fix:** Use spacing scale
```
20px      → var(--spacing-5)
10px      → var(--spacing-2)
15px      → var(--spacing-3)
```

### 3. Hardcoded Border Radius (80+ instances)
**Fix:** Use radius system
```
12px      → var(--border-radius-lg)
8px       → var(--border-radius-md)
6px       → var(--border-radius-md)
```

### 4. Hardcoded Shadows (50+ instances)
**Fix:** Use shadow system
```
0 2px 8px rgba(0,0,0,0.1)    → var(--shadow-sm)
0 4px 12px rgba(0,0,0,0.15)  → var(--shadow-md)
```

### 5. Inconsistent Breakpoints
**Fix:** Standardize to 480px, 768px, 1024px, 1200px

---

## CSS Module Organization

```
client/src/
├── styles/
│   ├── global.css                    (Design tokens - MAIN)
│   ├── website/                      (Landing, Login)
│   ├── terminal/                     (Dashboard screens)
│   │   ├── documents/                (DocumentGeneration - 6,221 lines)
│   │   └── admin/                    (Admin pages)
│   ├── DocumentGenerator/            (Form components)
│   └── admin/                        (Admin modals)
└── components/common/
    └── Header.module.css
```

**Colocation:** CSS files live next to components (BEST PRACTICE)

---

## Accessibility Notes

### Good Practices
- Focus states: 2px outline with offset
- Reduced motion: Respected via @media query
- Touch targets: 44-48px on mobile
- Color contrast: Generally WCAG AA (exceptions noted)

### Issues Found
- Some muted text colors fail contrast tests
- Font weight changes cause layout shifts
- Some small interactive elements < 44px

---

## Quick Wins for Improvement

1. **Add Missing Tokens** (1 day)
   - `--overlay-dark`, `--overlay-light`
   - `--blur-sm`, `--blur-md`, `--blur-lg`
   - Breakpoint variables

2. **Create Style Guide** (2 days)
   - Document all tokens
   - Provide component examples
   - Usage guidelines

3. **Fix Color Hardcoding** (2-3 days)
   - Audit all hex/rgb values
   - Systematic replacement with variables
   - Find-replace + manual verification

4. **Standardize Spacing** (2-3 days)
   - Replace all hardcoded px values
   - Use spacing scale exclusively

5. **Consolidate Cards** (1 day)
   - Remove `.modern-card` duplicate
   - Create `.card-sm`, `.card-lg` variants

---

## Files to Know

**Main Design System:**
- `/client/src/styles/global.css` (1,171 lines - PRIMARY)

**Large/Complex:**
- `/client/src/styles/terminal/documents/DocumentGeneration.module.css` (6,221 lines)
- `/client/src/styles/website/LandingPage.new.css` (1,067 lines)
- `/client/src/styles/terminal/SocialFeed.module.css` (863 lines)
- `/client/src/styles/website/Login.module.css` (863 lines)

**Header/Navigation:**
- `/client/src/components/common/Header.module.css` (573 lines)

---

## Testing Checklist

When making styling changes:
- [ ] All colors use CSS variables (no hex/rgb hardcoded)
- [ ] All spacing uses `--spacing-*` scale
- [ ] All shadows use `--shadow-*` system
- [ ] All transitions use `--transition-*`
- [ ] Border radius uses `--border-radius-*`
- [ ] Focus states are visible and clear
- [ ] Mobile touch targets are 44px minimum
- [ ] Hover/active states are consistent
- [ ] Color contrast meets WCAG AA
- [ ] Responsive breakpoints are consistent

---

## Design Decision Framework

**When styling a new component, ask:**

1. **Colors?**
   - Use existing --color-* variables
   - If not available, add to global.css

2. **Spacing?**
   - Use --spacing-1 through --spacing-24
   - Never hardcode pixel values

3. **Typography?**
   - Use --font-size-* for sizes
   - Use --font-weight for weights
   - Keep line-height: 1.6 for body text

4. **Shadows?**
   - Use --shadow-xs through --shadow-2xl
   - At-rest: shadow-sm/md
   - Hover: shadow-lg/xl

5. **Borders?**
   - Use --border-radius-* scale
   - Consistent with component type

6. **Responsive?**
   - Mobile-first approach
   - Use 480px, 768px, 1024px breakpoints
   - Test on actual devices

7. **Animation?**
   - Use --transition-fast/medium/slow
   - Respect prefers-reduced-motion

---

## Future Improvements

1. **Design Token Generator** (Style Dictionary integration)
2. **Component Library Documentation**
3. **Stylelint Configuration** (enforce token usage)
4. **Figma Design System** (sync with code tokens)
5. **Dark Mode Support** (theme CSS variables)
6. **Internationalization** (RTL language support)

---

**Last Updated:** 2025-10-31
**Analysis File:** `/STYLING_ARCHITECTURE_ANALYSIS.md` (full detailed analysis)
