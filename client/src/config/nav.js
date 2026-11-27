/**
 * Terminal sidebar navigation — single config-driven source of truth.
 *
 * De-merge (Nexa → two products) Phase 1: the interior navigation adapts to the
 * user's product by role/tier, without scattering conditionals across the
 * Sidebar component.
 *
 *   Product A (Basic / standard_user) → SMB self-serve tools. Supply-side items
 *     (Случаи / Topics Q&A / Продажна инка / Виртуелен саем) stay hidden via the
 *     tier `shows*` predicates — the SMB layout is the historical layout.
 *   Product B (Pro / admin_user) → a lawyer-focused layout that foregrounds
 *     Клиенти и раст (Leads · Topics · Marketing · Sales) and demotes the SMB
 *     tooling into a compact "Алатки" drawer (accessible, not deleted).
 *   ADMIN (Martin) → the full SMB layout; every predicate resolves true for
 *     admin, and the dedicated admin menu lives separately in Sidebar.js.
 *
 * Item shape matches the Sidebar renderer exactly:
 *   { key, icon?, label, path? | children:[{path,label}], visible?(user) }
 * A section with `label:null` renders as an always-open, unlabeled group.
 */

import {
  showsMarketing,
  showsLeads,
  showsTopicsQA,
  showsFair,
  showsSourcing,
  showsSalesFunnel,
  showsProcurementRegister,
  interiorProduct
} from '../lib/tier';

// ── Item catalog (defined once, composed into per-product layouts below) ────
const dashboard = { key: 'dashboard', icon: 'home', label: 'Контролна табла', path: '/terminal' };

const documents = {
  key: 'documents', icon: 'doc', label: 'Документи',
  children: [
    { path: '/terminal/documents',    label: 'Автоматизирани документи' },
    { path: '/terminal/my-templates', label: 'Мои шаблони' }
  ]
};

// Pro (leads.nexa.mk) variant: lawyers also manage saved client profiles used
// when generating documents on behalf of a client. Basic keeps `documents`.
const proDocuments = {
  key: 'documents', icon: 'doc', label: 'Документи',
  children: [
    { path: '/terminal/documents',    label: 'Автоматизирани документи' },
    { path: '/terminal/clients',      label: 'Клиентски профили' },
    { path: '/terminal/my-templates', label: 'Мои шаблони' }
  ]
};

// Човечки ресурси section leaves: the employee registry, the character
// assessment, and a shortcut into the labour-law document category.
const employees   = { key: 'employees', icon: 'people', label: 'Вработени', path: '/terminal/employees' };
const labourDocs  = { key: 'labour-docs', icon: 'doc', label: 'Работни односи', path: '/terminal/documents?cat=labourLaw' };

const contracts = {
  key: 'contracts', icon: 'inbox', label: 'Договори',
  children: [
    { path: '/terminal/contracts',         label: 'Мои договори' },
    { path: '/terminal/contract-analysis', label: 'Анализа на договор' }
  ]
};

const legalAi = { key: 'legal-ai', icon: 'ai', label: 'AI Тим', path: '/terminal/ai-team' };

// „Разговори" (requester + Pro conversations) lives in the corner messaging bar
// — components/chatbot/MessagingBar.jsx. Pros also get this sidebar link, because
// invites send no email: this is where they find and join them.
const proConversations = { key: 'pro-conversations', icon: 'inbox', label: 'Разговори', path: '/terminal/pro/conversations' };
// „Сите барања" — admin-only oversight of every Ask-a-Pro request; admin can reject
// (remove) an open request from here. Requests auto-publish, so this is for cleanup.
const adminRequests = { key: 'admin-requests', icon: 'inbox', label: 'Сите барања', path: '/terminal/admin-user/requests', visible: (user) => user?.role === 'admin' };

const screening = {
  key: 'screening', icon: 'check', label: 'Проверки',
  children: [
    { path: '/terminal/legal-screening', label: 'Правна' },
    { path: '/terminal/hr-screening',    label: 'HR и Оперативна' },
    { path: '/terminal/cyber-screening', label: 'Сајбер безбедност' }
  ]
};

// „Проценка на карактер" — Big Five personality assessment the employer sends to a
// candidate/employee; the profile report comes back to the owner. SMB HR tool.
const characterCheck = { key: 'character-check', icon: 'people', label: 'Проценка на карактер', path: '/terminal/karakter' };

// „Интервјуа" — send editable interview questionnaires to a candidate (scan) or a
// departing employee (exit); answers + AI summary come back to the owner. SMB HR tool.
const interviews = {
  key: 'interviews', icon: 'qa', label: 'Интервјуа',
  children: [
    { path: '/terminal/interviews/scan', label: 'Интервју скен' },
    { path: '/terminal/interviews/exit', label: 'Излезно интервју' },
  ],
};

const sourcing          = { key: 'sourcing', icon: 'rfq', label: 'Барање за понуди', path: '/terminal/sourcing', visible: showsSourcing };
// Регистар на набавки — log offers per type of purchase + renewal reminders.
const procurementRegister = { key: 'procurement-register', icon: 'inbox', label: 'Регистар на набавки', path: '/terminal/nabavki', visible: showsProcurementRegister };
const sales             = { key: 'sales', icon: 'funnel', label: 'Клиенти', path: '/terminal/sales', visible: showsSalesFunnel };
// Моја страница — the company's public one-pager (/f/:slug), edited in Мој профил.
const myPage            = { key: 'my-page', icon: 'globe', label: 'Моја страница', path: '/terminal/moj-profil' };
// Објави — structured company posts (Понуда/акција · Бараме · Ново кај нас).
const posts             = { key: 'posts', icon: 'pencil', label: 'Објави', path: '/terminal/objavi', visible: showsSalesFunnel };
// Понуди — quotes sent as a link; the client accepts with one click (moves the deal).
const quotes            = { key: 'quotes', icon: 'rfq', label: 'Понуди', path: '/terminal/ponudi', visible: showsSalesFunnel };
const marketingScreening = { key: 'marketing-screening', icon: 'check', label: 'Маркетинг проверка', path: '/terminal/marketing-screening' };
// Банер во билтенот — book a banner slot in the monthly Nexa newsletter. Deep-links
// straight to the banner tab; the Blog tab of the hub stays a Pro surface, so Basic
// sees only banner (MarketingHub hides Блог for tier A). Hidden for sub-seats.
const newsletterBanner  = { key: 'newsletter-banner', icon: 'inbox', label: 'Банер во билтенот', path: '/terminal/marketing-hub?tab=banner', visible: showsMarketing };
const fair              = { key: 'fair', icon: 'store', label: 'Виртуелен саем', path: '/terminal/fair', visible: showsFair };
const leads             = { key: 'leads', icon: 'inbox', label: 'Случаи', path: '/terminal/leads', visible: showsLeads };
const topicsqa = { key: 'topicsqa', icon: 'qa', label: 'Теми', path: '/terminal/topics-qa', visible: showsTopicsQA };
const education = { key: 'education', icon: 'book', label: 'Курсеви', path: '/terminal/education' };

// Contract analysis as a standalone leaf for the Pro "Алатки" drawer (the
// full Договори group is SMB-oriented and hidden for Pro).
const contractAnalysis = { key: 'contract-analysis', icon: 'inbox', label: 'Анализа на договор', path: '/terminal/contract-analysis' };

// Предмети — case/matter management workspace (deadlines, timeline, client status link).
const cases = { key: 'cases', icon: 'folder', label: 'Предмети', path: '/terminal/cases' };

// Правна проверка — the Legal Health Check, surfaced for Pro too (same page the
// SMB layout exposes under Проверки → Правна).
const legalScreening = { key: 'legal-screening', icon: 'check', label: 'Правна проверка', path: '/terminal/legal-screening' };

// ── Product B relabels (SMB keeps the originals above) ──────────────────────
// Blog = the marketing hub, framed as the lawyer's publishing surface.
const proBlog    = { key: 'marketing-hub', icon: 'pencil', label: 'Блог', path: '/terminal/marketing-hub', visible: showsMarketing };
// Потенцијални клиенти = the sales-funnel page, framed as a CRM to record leads.
const proClients = { key: 'sales', icon: 'people', label: 'Потенцијални клиенти', path: '/terminal/sales', visible: showsSalesFunnel };

// ── Product A (SMB) + ADMIN — the historical task-based layout ──────────────
// Продажна инка („Клиенти") is visible to every company (showsSalesFunnel).
const smbSections = [
  { key: 'top', label: null, items: [dashboard] },
  // Продажба first (Nov 2026 pivot: Nexa brings clients and money, not only
  // saves time) — open by default until the user collapses it.
  {
    key: 'sales', label: 'Продажба', defaultOpen: true,
    items: [myPage, posts, sales, quotes]
  },
  {
    key: 'growth', label: 'Маркетинг и раст',
    items: [marketingScreening, newsletterBanner, fair]
  },
  {
    key: 'administration', label: 'Администрација',
    items: [documents, contracts, adminRequests, screening]
  },
  {
    key: 'human-resources', label: 'Човечки ресурси',
    items: [employees, characterCheck, interviews, labourDocs]
  },
  {
    key: 'procurement', label: 'Набавки',
    items: [sourcing, procurementRegister]
  },
  {
    key: 'education-sec', label: 'Едукација',
    items: [education]
  },
  // AI Тим — standalone leaf below (not within) Едукација.
  { key: 'ai-team-sec', label: null, items: [legalAi] }
];

// ── Product B (Lawyers / Pro) — client-acquisition first ────────────────────
// Leads + Topics + Marketing + Sales foregrounded; SMB tooling demoted into a
// compact "Алатки" drawer (Employees / Contracts registry / compliance checks /
// Marketing-AI are omitted — accessible by URL, off the primary nav).
const proSections = [
  // Primary group — always open, no header. Разговори (invites + client chats),
  // then the three client-getting surfaces: Случаи (claim a case), Topics Q&A
  // (visibility + SEO), Блог (branding), plus a lightweight CRM to track potential
  // clients. Dashboard is reached via the Nexa logo, so it's not a nav item here.
  {
    key: 'clients-growth', label: null,
    items: [proConversations, leads, topicsqa, proBlog, proClients, quotes]
  },
  {
    key: 'pro-tools', label: 'Алатки',
    items: [proDocuments, contractAnalysis, cases, legalScreening, characterCheck, interviews]
  },
  {
    key: 'education-sec', label: 'Едукација',
    items: [education]
  },
  // AI Тим — standalone leaf below (not within) Едукација.
  { key: 'ai-team-sec', label: null, items: [legalAi] }
];

/**
 * Return the ordered sidebar sections for this USER.
 *
 * Driven by the user's ENTITLEMENT (interiorProduct), not the domain: a Pro
 * lawyer sees the lawyer layout (with Случаи/Предмети) even if she signed up on
 * nexa.mk. Logged-out fallback is the domain. The per-item `visible()`
 * predicates still gate individual entries by entitlement.
 */
export function buildSidebarSections(user) {
  return interiorProduct(user) === 'B' ? proSections : smbSections;
}
