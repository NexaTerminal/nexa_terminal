# Nexa Platform Style System

## Color Palette

### Primary & Accent Colors
- **Primary Action (`--color-primary`):** `#4F46E5` (A vibrant indigo, used for primary buttons, links, and focus indicators.)
- **Accent / Dynamic Category (`--category-color`):** Varies (Dynamically applied based on the document category, defaults to primary.)

### Neutral Shades
- **Background (`--color-off-white`):** `#f9fafb` (Light gray, used for page backgrounds.)
- **Content Background (`--color-white`):** `#ffffff` (Used for cards, modals, and content sections.)
- **Borders (`--color-light-gray`):** `#d1d5db` (Subtle gray for borders and dividers.)
- **Primary Text (`--color-dark-gray`):** `#111827` (High-contrast dark gray for headings and primary text.)
- **Secondary Text (`--color-medium-gray`):** `#4b5563` (Softer gray for descriptions, labels, and secondary information.)
- **Dark UI Elements (`--color-dark`):** `#282c34` (Used for dark-themed components like headers or buttons.)

### Semantic Colors
- **Error/Danger:** (Not explicitly defined, but could be a red like `#EF4444`)
- **Success/Confirmation:** (Not explicitly defined, but could be a green like `#10B981`)

## Typography

### Font Families
- **Primary Font:** `'Inter', sans-serif` (A clean, modern sans-serif for all UI text.)
- **System Fallback:** `-apple-system, BlinkMacSystemFont, 'Segoe UI', ...` (Ensures system-native fonts are used if Inter is unavailable.)
- **Monospace/Code:** `source-code-pro, Menlo, Monaco, ...` (For code blocks or technical displays.)

### Font Sizes
- **Jumbo Heading (h1):** `2.5rem`
- **Large Title:** `1.8rem`
- **Medium Title:** `1.3rem`
- **Standard Text / Input:** `1rem` - `1.1rem`
- **Small Text / Labels:** `0.85rem` - `0.95rem`

### Font Weights
- **Bold:** `700`
- **Semi-Bold:** `600`
- **Medium:** `500`
- **Regular:** `400` (Default)

## Spacing & Sizing

### Standard Spacing Units
- **`--spacing-xs`:** `4px`
- **`--spacing-sm`:** `8px`
- **`--spacing-md`:** `16px`
- **`--spacing-lg`:** `24px`
- **Component Padding:** `20px` - `30px`
- **Gaps (Grid/Flex):** `15px` - `20px`

### Sizing
- **Max Content Width:** `1200px`
- **Modal Width:** `600px`
- **Sidebar Width:** `280px`

## Border Radius

- **Large (Modals, Headers):** `12px`
- **Medium (Cards, Inputs):** `8px`
- **Small (Buttons):** `6px`

## Shadows & Elevation

- **Subtle:** `0 4px 6px rgba(0, 0, 0, 0.05)` (For cards and static elements.)
- **Medium (Hover/Active):** `0 8px 12px rgba(0, 0, 0, 0.08)` (Provides interactive feedback.)
- **Focus Ring:** `0 0 0 3px rgba(79, 70, 229, 0.2)` (Clear accessibility indicator for focused inputs.)

## Layout

- **Main Layout:** Flexbox-based with a fixed sidebar and a main content area.
- **Grid System:** CSS Grid is used for responsive, auto-fitting columns (`repeat(auto-fit, minmax(280px, 1fr))`).
- **Responsiveness:** Media queries are used to adjust padding, font sizes, and layout for smaller screens (breakpoint at `768px`).
