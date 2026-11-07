// Vite plugin: writes dist/sw.js with the list of built files to pre-cache.
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

export default function serviceWorker() {
  return {
    name: 'mind-mapper-service-worker',
    apply: 'build',
    generateBundle(_, bundle) {
      const files = Object.keys(bundle)
        .filter((f) => !f.endsWith('.map'))
        .concat(['logo.svg', 'favicon.ico', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png', 'manifest.webmanifest', 'screenshots/hero.png'])
        .sort();
      const version = createHash('sha256').update(files.join('|')).digest('hex').slice(0, 10);
      const source = readFileSync(new URL('./sw-template.js', import.meta.url), 'utf8')
        .replace('__VERSION__', version)
        .replace('__PRECACHE__', JSON.stringify(files));
      this.emitFile({ type: 'asset', fileName: 'sw.js', source });
    },
  };
}
