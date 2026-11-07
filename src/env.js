// Which environment this build is for: 'production', 'staging' or 'development'.
// Set at build time with VITE_APP_ENV (see .github/workflows/deploy.yml).
export const APP_ENV = import.meta.env.VITE_APP_ENV || 'production';

export const ENV_LABEL = { staging: 'STAGING', development: 'DEV' }[APP_ENV] ?? null;

/**
 * Browser-storage key for this environment. Production keeps the original keys so
 * existing users don't lose their maps; dev and staging get their own space, so
 * testing never touches production data in the same browser.
 */
export const storageKey = (name) => (APP_ENV === 'production' ? `mindmapper.${name}` : `mindmapper.${APP_ENV}.${name}`);
