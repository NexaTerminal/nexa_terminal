# Blog Changes Implementation Plan

## Overview

**Current Flow:**
- Public blog shows ~20% content (excerpt) with fade effect
- Login gate appears after excerpt
- Full content only available after login in `/terminal/blogs/:id`

**New Flow:**
- Public blog shows 100% full content
- No fade, no login gate
- Promotional banner at the end of each article
- Admin selects which tool to promote when creating/editing the blog

---

## Phase 1: Define Promoted Tools Options

### Tool Options (10-15 predefined)

```javascript
const PROMOTED_TOOLS = [
  {
    id: 'legal_health_check',
    name: 'Правен Здравствен Преглед',
    description: 'Проверете дали вашата компанија е усогласена со законските регулативи. Направете 360° преглед и добијте акционен план за елиминирање на сите законски ризици.',
    icon: '⚖️',
    link: '/terminal/legal-screening',
    category: 'legal',
    ctaText: 'Направи бесплатна проверка',
    videoUrl: null // TODO: Add video URL
  },
  {
    id: 'marketing_health_check',
    name: 'Маркетинг Здравствен Преглед',
    description: 'Анализирајте ја вашата маркетинг стратегија и добијте персонализирани препораки за подобрување на резултатите.',
    icon: '📈',
    link: '/terminal/marketing-health-check',
    category: 'marketing',
    ctaText: 'Анализирај го мојот маркетинг',
    videoUrl: null // TODO: Add video URL
  },
  {
    id: 'employment_documents',
    name: 'Документи за Вработување',
    description: 'Генерирајте договори за вработување, одлуки и други документи за помалку од 60 секунди. Целосно усогласени со македонското законодавство.',
    icon: '📄',
    link: '/terminal/documents/employment',
    category: 'legal',
    ctaText: 'Креирај документ',
    videoUrl: 'https://www.youtube.com/watch?v=WG9Z0NadFJg' // Document automation video
  },
  {
    id: 'gdpr_documents',
    name: 'GDPR Документи',
    description: 'Подгответе ја вашата компанија за заштита на лични податоци со професионални документи и политики.',
    icon: '🔒',
    link: '/terminal/documents/gdpr',
    category: 'legal',
    ctaText: 'Генерирај GDPR документи',
    videoUrl: null // TODO: Add video URL
  },
  {
    id: 'business_contracts',
    name: 'Деловни Договори',
    description: 'Договори за соработка, NDA, договори за услуги и повеќе. Стандардизирани професионални шаблони готови за употреба.',
    icon: '🤝',
    link: '/terminal/documents/contracts',
    category: 'legal',
    ctaText: 'Креирај договор',
    videoUrl: 'https://www.youtube.com/watch?v=WG9Z0NadFJg' // Document automation video
  },
  {
    id: 'ai_legal_assistant',
    name: 'AI Правен Асистент',
    description: 'Добијте инстантна јасност за македонските закони 24/7. Нашиот АИ асистент цитира релевантни закони и судска пракса.',
    icon: '🤖',
    link: '/terminal/ai-chat',
    category: 'legal',
    ctaText: 'Прашај го AI асистентот',
    videoUrl: 'https://www.youtube.com/watch?v=IbTsGXAXHdY' // AI Legal Assistant video
  },
  {
    id: 'ai_marketing_assistant',
    name: 'AI Маркетинг Стратег',
    description: 'Добијте персонализирани маркетинг совети за вашиот бизнис. AI консултантот ќе ви помогне да изградите стратегија.',
    icon: '💡',
    link: '/terminal/marketing-ai',
    category: 'marketing',
    ctaText: 'Разговарај со AI стратег',
    videoUrl: null // TODO: Add video URL
  },
  {
    id: 'company_documents',
    name: 'Документи за Компании',
    description: 'Одлуки, акти и документи за управување со компанија. Генерирајте професионални документи за помалку од минута.',
    icon: '🏢',
    link: '/terminal/documents/company',
    category: 'business',
    ctaText: 'Генерирај документ',
    videoUrl: 'https://www.youtube.com/watch?v=WG9Z0NadFJg' // Document automation video
  },
  {
    id: 'cyber_health_check',
    name: 'Сајбер Безбедност Преглед',
    description: 'Проверете ја безбедноста на вашите дигитални системи и заштитете го вашиот бизнис од сајбер закани.',
    icon: '🛡️',
    link: '/terminal/cyber-health-check',
    category: 'technology',
    ctaText: 'Направи безбедносна проверка',
    videoUrl: null // TODO: Add video URL
  },
  {
    id: 'free_trial',
    name: 'Бесплатна Проба',
    description: 'Регистрирајте се бесплатно и добијте 14 кредити неделно. Пристапете до сите алатки без никаков ризик.',
    icon: '🎁',
    link: '/register',
    category: 'general',
    ctaText: 'Започни бесплатно',
    videoUrl: null // TODO: Add general promo video
  },
  {
    id: 'social_feed',
    name: 'Деловна Заедница',
    description: 'Поврзете се со други претприемачи, споделувајте искуства и соработувајте. Градење на вредна професионална мрежа.',
    icon: '👥',
    link: '/terminal/feed',
    category: 'general',
    ctaText: 'Приклучи се на заедницата',
    videoUrl: null // TODO: Add video URL
  },
  {
    id: 'none',
    name: 'Без промоција',
    description: 'Не прикажувај промотивен банер',
    icon: '❌',
    link: null,
    category: null,
    ctaText: null,
    videoUrl: null
  }
];
```

### Video Integration Notes

Each promoted tool includes a `videoUrl` field for YouTube videos:
- Videos should be short tutorials (1-3 min) showing how to use the tool
- Similar to the /about page video sections
- Responsive embed with 16:9 aspect ratio
- If `videoUrl` is null, banner shows without video (text only)

---

## Phase 2: Backend Changes

### 2.1 Update Blog Schema

**File:** `server/controllers/blogController.js`

Add `promotedTool` field to blog creation/update:

```javascript
// In createBlog function
const blogData = {
  // ... existing fields
  promotedTool: req.body.promotedTool || 'free_trial' // default to free trial
};
```

### 2.2 Update Public API to Return Full Content

**File:** `server/routes/blog.js`

Change the public blog detail endpoint to include `content`:

```javascript
// GET /api/blog/:id - Now returns full content
router.get('/:id', async (req, res) => {
  // ...
  // Remove the projection that excludes 'content'
  // Include 'content' and 'promotedTool' in response
});
```

---

## Phase 3: Frontend Changes

### 3.1 Create Promoted Tool Banner Component

**New File:** `client/src/components/blog/PromotedToolBanner.js`

```jsx
// Reusable banner component that displays based on promotedTool id
// Shows: icon, title, description, CTA button
// Styled as an attractive card/banner
// Links to the tool (requires login redirect if not authenticated)
```

### 3.2 Create Promoted Tools Config

**New File:** `client/src/config/promotedTools.js`

```javascript
// Export PROMOTED_TOOLS array with all 10-15 options
// Helper function: getPromotedToolById(id)
```

### 3.3 Update Public BlogPost.js

**File:** `client/src/pages/website/BlogPost.js`

Changes:
1. Remove automatic redirect for logged-in users (optional - they can still view public)
2. Fetch and display full `content` instead of just `excerpt`
3. Remove the fade effect (`.excerptFade`)
4. Remove the login gate modal
5. Add `<PromotedToolBanner tool={post.promotedTool} />` at the end

### 3.4 Update BlogPost.module.css

**File:** `client/src/styles/website/BlogPost.module.css`

Changes:
1. Remove `.excerptFade` styles (or keep but don't use)
2. Remove `.loginGate` styles (or keep but don't use)
3. Add styles for the promoted tool banner

### 3.5 Update Admin AddBlog.js

**File:** `client/src/pages/terminal/admin/AddBlog.js`

Add new form field:

```jsx
<div className={styles.formGroup}>
  <label>Промовирај алатка</label>
  <select
    name="promotedTool"
    value={formData.promotedTool}
    onChange={handleChange}
  >
    {PROMOTED_TOOLS.map(tool => (
      <option key={tool.id} value={tool.id}>
        {tool.icon} {tool.name}
      </option>
    ))}
  </select>
  <small>Изберете која алатка ќе се прикаже на крајот од статијата</small>
</div>
```

---

## Phase 4: Implementation Order

### Step 1: Create Config File
- Create `client/src/config/promotedTools.js` with all tool definitions

### Step 2: Create Banner Component
- Create `client/src/components/blog/PromotedToolBanner.js`
- Create `client/src/components/blog/PromotedToolBanner.module.css`

### Step 3: Update Backend
- Update `server/routes/blog.js` to return full content publicly
- Update `server/controllers/blogController.js` to handle `promotedTool` field

### Step 4: Update Public Blog Page
- Modify `client/src/pages/website/BlogPost.js`:
  - Display full content
  - Remove fade/login gate
  - Add promoted tool banner

### Step 5: Update Admin Form
- Modify `client/src/pages/terminal/admin/AddBlog.js`:
  - Add promotedTool dropdown

### Step 6: Update Existing Blogs (Optional)
- Create migration script to set default `promotedTool` for existing blogs

---

## Phase 5: Banner Design (Text + Video)

### Desktop Layout (Side by Side)
```
┌───────────────────────────────────────────────────────────────────────────┐
│                                                                            │
│  ┌─────────────────────────────┐    ┌──────────────────────────────────┐  │
│  │                              │    │                                  │  │
│  │  ⚖️ Правен Здравствен       │    │     ┌────────────────────────┐   │  │
│  │     Преглед                  │    │     │                        │   │  │
│  │                              │    │     │    ▶  YouTube Video    │   │  │
│  │  Проверете дали вашата       │    │     │                        │   │  │
│  │  компанија е усогласена со   │    │     │    (16:9 aspect)       │   │  │
│  │  законските регулативи.      │    │     │                        │   │  │
│  │  Направете 360° преглед...   │    │     └────────────────────────┘   │  │
│  │                              │    │                                  │  │
│  │  [Направи бесплатна проверка →]  │                                  │  │
│  │                              │    │                                  │  │
│  └─────────────────────────────┘    └──────────────────────────────────┘  │
│                                                                            │
└───────────────────────────────────────────────────────────────────────────┘
```

### Mobile Layout (Stacked)
```
┌───────────────────────────────┐
│  ⚖️ Правен Здравствен Преглед │
│                                │
│  Проверете дали вашата         │
│  компанија е усогласена...     │
│                                │
│  ┌────────────────────────┐    │
│  │                        │    │
│  │    ▶  YouTube Video    │    │
│  │       (16:9)           │    │
│  │                        │    │
│  └────────────────────────┘    │
│                                │
│  [Направи бесплатна проверка →]│
└───────────────────────────────┘
```

### No Video Fallback (Text Only)
```
┌───────────────────────────────────────────────────────────────┐
│                                                                │
│  ⚖️ Правен Здравствен Преглед                                  │
│                                                                │
│  Проверете дали вашата компанија е усогласена со законските   │
│  регулативи. Направете 360° преглед и добијте акционен план.  │
│                                                                │
│  [Направи бесплатна проверка →]                               │
│                                                                │
└───────────────────────────────────────────────────────────────┘
```

### Styling Notes
- Background: Light gradient or subtle brand color
- Border radius: Rounded corners for modern look
- Video: Lazy loading, 16:9 aspect ratio responsive
- CTA Button: Primary brand color, prominent placement
- Mobile: Stack vertically, video below text

---

## Questions to Clarify

1. **Banner Design:** Which style do you prefer (Card, Horizontal, or Subtle)?

2. **Default Tool:** What should be the default promoted tool for new blogs? (Suggested: `free_trial`)

3. **Existing Blogs:** Should we migrate existing blogs to have a default tool, or leave them without promotion?

4. **Multiple Tools:** Do you want option to show multiple tools, or always just one?

5. **Tool Categories:** Should the admin form filter tools by blog category? (e.g., legal blogs only show legal tools)

---

## Files to Create/Modify

### New Files:
- `client/src/config/promotedTools.js`
- `client/src/components/blog/PromotedToolBanner.js`
- `client/src/components/blog/PromotedToolBanner.module.css`

### Modified Files:
- `server/routes/blog.js` - Return full content publicly
- `server/controllers/blogController.js` - Handle promotedTool field
- `client/src/pages/website/BlogPost.js` - Remove gate, add banner
- `client/src/styles/website/BlogPost.module.css` - Banner styles
- `client/src/pages/terminal/admin/AddBlog.js` - Add tool selector

---

## Estimated Changes

- ~50 lines: New config file
- ~80 lines: New banner component + styles
- ~30 lines: Backend updates
- ~50 lines: BlogPost.js modifications
- ~20 lines: Admin form additions

**Total: ~230 lines of code**
