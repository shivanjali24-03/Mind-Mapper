// Free and Pro plans: what each includes and the rules for upgrade prompts.
// Billing here is a demo: upgrading only changes a setting in the browser.

export const PLANS = {
  free: { id: 'free', name: 'Free', monthly: 0, yearly: 0, maxMaps: 5, tagline: 'For personal brainstorming' },
  pro: { id: 'pro', name: 'Pro', monthly: 8, yearly: 72, maxMaps: Infinity, tagline: 'For professionals who plan and present' },
};

/** Features that need Pro, with the reason shown in the upgrade prompt. */
export const PRO_ONLY = {
  pdf: 'PDF export is a Pro feature.',
  json: 'JSON backups are a Pro feature.',
  import: 'Importing JSON backups is a Pro feature.',
  present: 'Presentation mode is a Pro feature.',
};

/** Comparison table rows: [feature, free, pro] (true / false / text). */
export const COMPARISON = [
  ['Maps', '5', 'Unlimited'],
  ['Unlimited ideas, 16 templates, guided tour', true, true],
  ['Undo, search, focus mode and outline view', true, true],
  ['Tasks, due dates and progress rings', true, true],
  ['Paste to map, PNG and Markdown export', true, true],
  ['PDF export and JSON backup / import', false, true],
  ['Presentation mode', false, true],
  ['Priority support', false, true],
];

export const isPro = (plan) => plan?.id === 'pro';

export const canUse = (plan, feature) => isPro(plan) || !(feature in PRO_ONLY);

export const canCreateMap = (plan, mapCount) => isPro(plan) || mapCount < PLANS.free.maxMaps;

/** Whole-number % saved by paying yearly instead of monthly. */
export const yearlySavingPct = () => Math.round((1 - PLANS.pro.yearly / (PLANS.pro.monthly * 12)) * 100);

/** Price per month for the chosen billing period. */
export const monthlyPrice = (billing) => (billing === 'yearly' ? PLANS.pro.yearly / 12 : PLANS.pro.monthly);

/** Read a stored plan safely; anything unexpected falls back to Free. */
export function parsePlan(raw) {
  try {
    const p = JSON.parse(raw);
    if (p?.id === 'pro' && (p.billing === 'monthly' || p.billing === 'yearly')) return { id: 'pro', billing: p.billing, since: String(p.since ?? '') };
  } catch {
    /* fall through */
  }
  return { id: 'free' };
}
