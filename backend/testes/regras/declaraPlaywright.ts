/** Diz se um package.json declara @playwright/test. */
import { Fonte } from '../tipos/frameworks.js';

export const declaraPlaywright = (f: Fonte) => { if (!/(^|[\\/])package\.json$/.test(f.path)) return false; try { const p = JSON.parse(f.content); return !!({ ...p.dependencies, ...p.devDependencies })['@playwright/test']; } catch { return false; } };
