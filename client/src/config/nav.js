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

import { activeProduct } from '../lib/storefront';
import {
  showsMarketing,
  showsLeads,
  showsTopicsQA,
  showsFair,
  showsSourcing,
  showsSalesFunnel
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

const employees = { key: 'employees', icon: 'people', label: 'Вработени', path: '/terminal/employees' };

const contracts = {
  key: 'contracts', icon: 'inbox', label: 'Договори',
  children: [
    { path: '/terminal/contracts',         label: 'Мои договори' },
    { path: '/terminal/contract-analysis', label: 'Анализа на договор' }
  ]
};

const legalAi = { key: 'legal-ai', icon: 'ai', label: 'Правен AI', path: '/terminal/ai-chat' };

const screening = {
  key: 'screening', icon: 'check', label: 'Проверки',
  children: [
    { path: '/terminal/legal-screening', label: 'Правна' },
    { path: '/terminal/hr-screening',    label: 'HR и Оперативна' },
    { path: '/terminal/cyber-screening', label: 'Сајбер безбедност' }
  ]
};

const sourcing          = { key: 'sourcing', icon: 'rfq', label: 'Барање за понуди', path: '/terminal/sourcing', visible: showsSourcing };
const sales             = { key: 'sales', icon: 'funnel', label: 'Клиенти', path: '/terminal/sales', visible: showsSalesFunnel };
const marketingAi       = { key: 'marketing-ai', icon: 'ai', label: 'Маркетинг AI', path: '/terminal/marketing-ai' };
const marketingScreening = { key: 'marketing-screening', icon: 'check', label: 'Маркетинг проверка', path: '/terminal/marketing-screening' };
const fair              = { key: 'fair', icon: 'store', label: 'Виртуелен саем', path: '/terminal/fair', visible: showsFair };
const leads             = { key: 'leads', icon: 'inbox', label: 'Случаи', path: '/terminal/leads', visible: showsLeads };
const topicsqa = { key: 'topicsqa', icon: 'qa', label: 'Теми', path: '/terminal/topics-qa', visible: showsTopicsQA };
const education = { key: 'education', icon: 'book', label: 'Курсеви', path: '/terminal/education' };

// Contract analysis as a standalone leaf for the Pro "Алатки" drawer (the
// full Договори group is SMB-oriented and hidden for Pro).
const contractAnalysis = { key: 'contract-analysis', icon: 'inbox', label: 'Анализа на договор', path: '/terminal/contract-analysis' };

// ── Product B relabels (SMB keeps the originals above) ──────────────────────
// Blog = the marketing hub, framed as the lawyer's publishing surface.
const proBlog    = { key: 'marketing-hub', icon: 'pencil', label: 'Блог', path: '/terminal/marketing-hub', visible: showsMarketing };
// Клиенти = the sales-funnel page, framed as a CRM to record potential clients.
const proClients = { key: 'sales', icon: 'people', label: 'Клиенти', path: '/terminal/sales', visible: showsSalesFunnel };

// ── Product A (SMB) + ADMIN — the historical task-based layout ──────────────
// Unchanged for A/ADMIN except that Продажна инка now carries showsSalesFunnel
// (a supply-side tool — hidden for Basic, kept for admin).
const smbSections = [
  { key: 'top', label: null, items: [dashboard] },
  {
    key: 'administration', label: 'Администрација',
    items: [documents, employees, contracts, legalAi, screening]
  },
  {
    key: 'procurement', label: 'Набавки',
    items: [sourcing]
  },
  {
    // Случаи, Topics Q&A and Маркетинг live only in the Pro (leads.nexa.mk)
    // layout — they are the lawyer/provider surfaces. Basic keeps the rest.
    key: 'growth', label: 'Маркетинг и раст',
    items: [sales, marketingAi, marketingScreening, fair]
  },
  {
    key: 'education-sec', label: 'Едукација',
    items: [education]
  }
];

// ── Product B (Lawyers / Pro) — client-acquisition first ────────────────────
// Leads + Topics + Marketing + Sales foregrounded; SMB tooling demoted into a
// compact "Алатки" drawer (Employees / Contracts registry / compliance checks /
// Marketing-AI are omitted — accessible by URL, off the primary nav).
const proSections = [
  // Primary group — always open, no header. The three client-getting surfaces:
  // Случаи (claim a case), Topics Q&A (visibility + SEO), Блог (branding), plus
  // a lightweight CRM to track potential clients. Dashboard is reached via the
  // Nexa logo, so it's not a nav item here.
  {
    key: 'clients-growth', label: null,
    items: [leads, topicsqa, proBlog, proClients]
  },
  {
    key: 'pro-tools', label: 'Алатки',
    items: [proDocuments, contractAnalysis, legalAi]
  },
  {
    key: 'education-sec', label: 'Едукација',
    items: [education]
  }
];

/**
 * Return the ordered sidebar sections for the current PRODUCT.
 *
 * The shell is driven by the DOMAIN (leads.nexa.mk → Product B layout, nexa.mk →
 * Product A layout), not the user's tier — a signed-in user is redirected to the
 * host matching their plan at login (see PrivateRoute), so domain == plan for
 * real users. The per-item `visible()` predicates still gate by entitlement.
 * `user` is retained for signature compatibility with the Sidebar renderer.
 */
export function buildSidebarSections(user) { // eslint-disable-line no-unused-vars
  return activeProduct() === 'B' ? proSections : smbSections;
}
