import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// Tests run in a browser-like environment, so resolve files from the project root
const file = (rel) => join(process.cwd(), rel);
import { describe, expect, it } from 'vitest';

const manifest = JSON.parse(readFileSync(file('public/manifest.webmanifest'), 'utf8'));
const template = readFileSync(file('pwa/sw-template.js'), 'utf8');

describe('web app manifest', () => {
  it('has what browsers need to offer "Install app"', () => {
    expect(manifest.name).toBe('Mind Mapper');
    expect(manifest.display).toBe('standalone');
    expect(manifest.start_url).toBe('./'); // relative, so it works under /Mind-Mapper/
    const sizes = manifest.icons.map((i) => i.sizes);
    expect(sizes).toContain('192x192');
    expect(sizes).toContain('512x512');
  });

  it('only points at icons that exist', () => {
    for (const icon of manifest.icons) {
      expect(() => readFileSync(file(`public/${icon.src}`))).not.toThrow();
    }
  });
});

describe('service worker template', () => {
  it('has the placeholders the build fills in', () => {
    expect(template).toContain("'__VERSION__'");
    expect(template).toContain('__PRECACHE__');
  });

  it('leaves the staging, dev and api paths alone', () => {
    for (const p of ['staging/', 'dev/', 'api/']) expect(template).toContain(`'${p}'`);
  });
});
