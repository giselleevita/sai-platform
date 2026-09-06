/**
 * Structural guards over the routing layer.
 *
 * A router added without authentication, or written and never mounted, is the
 * kind of mistake that reads fine in review: the file looks like every other
 * route file. These read the source rather than the running app, so they cost
 * nothing and cannot be satisfied by a passing request in one lucky test.
 */
import fs from 'fs';
import path from 'path';

const ROUTES_DIR = path.join(__dirname, '..', 'routes');
const MAIN = fs.readFileSync(path.join(__dirname, '..', 'main.ts'), 'utf8');

/**
 * Routers that legitimately do not call authMiddleware, and why.
 * Anything else has to justify itself here rather than slip through.
 */
const EXEMPT: Record<string, string> = {
  auth: 'login, signup and the OIDC callback are the endpoints that create a session',
  scim: 'provisioning uses a bearer token, applied per route as scimAuthMiddleware',
};

const routeFiles = fs
  .readdirSync(ROUTES_DIR)
  .filter((file) => file.endsWith('.ts') && file !== 'index.ts')
  .map((file) => file.replace(/\.ts$/, ''));

describe('route files', () => {
  it('finds the routers to check', () => {
    expect(routeFiles.length).toBeGreaterThan(15);
  });

  describe.each(routeFiles)('%s', (name) => {
    const source = fs.readFileSync(path.join(ROUTES_DIR, `${name}.ts`), 'utf8');

    it('requires authentication, or is a documented exception', () => {
      if (EXEMPT[name]) {
        expect(EXEMPT[name]).toEqual(expect.any(String));
        return;
      }
      expect(source).toMatch(/router\.use\(\s*authMiddleware\s*\)/);
    });

    it('is mounted in main.ts', () => {
      expect(MAIN).toContain(`./routes/${name}`);
    });
  });
});

describe('exemptions', () => {
  it('names a route file that exists', () => {
    for (const name of Object.keys(EXEMPT)) {
      expect(routeFiles).toContain(name);
    }
  });

  it('still applies its own authentication per route', () => {
    const scim = fs.readFileSync(path.join(ROUTES_DIR, 'scim.ts'), 'utf8');
    const handlers = scim.match(/router\.(get|post|put|patch|delete)\(/g) || [];
    const guarded = scim.match(/scimAuthMiddleware/g) || [];

    expect(handlers.length).toBeGreaterThan(0);
    expect(guarded.length).toBeGreaterThanOrEqual(handlers.length);
  });
});
