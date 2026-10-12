/** Diz se um arquivo de teste importa @playwright/test. */
import { Fonte } from '../tipos/frameworks.js';

export const importaPlaywright = (f: Fonte) => /\.(spec|test)\.[cm]?[jt]s$/.test(f.path) && /from\s+['"]@playwright\/test['"]|require\(\s*['"]@playwright\/test['"]\s*\)/.test(f.content);
