import { describe, expect, it } from 'vitest';
import { PLANS, canCreateMap, canUse, monthlyPrice, parsePlan, yearlySavingPct } from './plans.js';

const free = { id: 'free' };
const pro = { id: 'pro', billing: 'yearly' };

describe('plans', () => {
  it('Free can create up to the map limit; Pro is unlimited', () => {
    expect(canCreateMap(free, PLANS.free.maxMaps - 1)).toBe(true);
    expect(canCreateMap(free, PLANS.free.maxMaps)).toBe(false);
    expect(canCreateMap(pro, 1000)).toBe(true);
  });

  it('gates only the Pro features', () => {
    for (const f of ['pdf', 'json', 'import', 'present']) {
      expect(canUse(free, f)).toBe(false);
      expect(canUse(pro, f)).toBe(true);
    }
    expect(canUse(free, 'png')).toBe(true);
    expect(canUse(free, 'md')).toBe(true);
  });

  it('prices yearly billing with a saving', () => {
    expect(yearlySavingPct()).toBe(25);
    expect(monthlyPrice('yearly')).toBe(6);
    expect(monthlyPrice('monthly')).toBe(8);
  });

  it('reads stored plans safely', () => {
    expect(parsePlan(JSON.stringify({ id: 'pro', billing: 'monthly', since: '2026-11-07' }))).toEqual({ id: 'pro', billing: 'monthly', since: '2026-11-07' });
    expect(parsePlan('not json')).toEqual({ id: 'free' });
    expect(parsePlan(JSON.stringify({ id: 'pro', billing: 'forever' }))).toEqual({ id: 'free' });
    expect(parsePlan(null)).toEqual({ id: 'free' });
  });
});
