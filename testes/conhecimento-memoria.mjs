import { mock } from 'node:test';
import { memoria } from './conhecimento-falso.mjs';
mock.module('../dist/conhecimento.js', { namedExports: memoria });
