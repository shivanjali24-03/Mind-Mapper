import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

const load = async (env) => {
  if (env) vi.stubEnv('VITE_APP_ENV', env);
  return import('./env.js');
};

describe('env', () => {
  it('defaults to production with the original storage keys and no badge', async () => {
    const { APP_ENV, ENV_LABEL, storageKey } = await load();
    expect(APP_ENV).toBe('production');
    expect(ENV_LABEL).toBeNull();
    expect(storageKey('maps.v1')).toBe('mindmapper.maps.v1');
  });

  it.each([
    ['staging', 'STAGING', 'mindmapper.staging.maps.v1'],
    ['development', 'DEV', 'mindmapper.development.maps.v1'],
  ])('%s gets its own badge and storage space', async (env, label, key) => {
    const { ENV_LABEL, storageKey } = await load(env);
    expect(ENV_LABEL).toBe(label);
    expect(storageKey('maps.v1')).toBe(key);
  });
});
