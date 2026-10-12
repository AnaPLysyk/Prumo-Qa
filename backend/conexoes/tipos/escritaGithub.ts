/** Formatos aceitos nas operações no GitHub (branch prumo/..., commit de teste, PR) e quais arquivos são de teste. */
import { z } from 'zod';
import { caminhoDeTesteValido } from '../github/caminhoDeTesteValido.js';

export const ramo = z.string().regex(/^prumo\/[a-z0-9][a-z0-9._/-]{2,78}$/).refine(r => !r.includes('..') && !r.endsWith('/') && !r.endsWith('.lock'), 'ramo inválido');

export const ramoBase = z.string().regex(/^[A-Za-z0-9][A-Za-z0-9._/-]{0,100}$/).refine(r => !r.includes('..'), 'ramo inválido');

export const sha40 = z.string().regex(/^[a-f0-9]{40}$/);

export const padraoTeste = /(^|\/)(tests?|e2e|__tests__|specs?|cypress|playwright|automacao|automation)\//i;

export const arquivoTeste = /\.(spec|test)\.[a-z]+$/i;

export const extensoes = /\.(ts|tsx|js|mjs|cjs|jsx|py|java|kt|cs|rb|feature|md|json|yml|yaml)$/i;

export const criarBranch = z.object({ nome: ramo, base: ramoBase.optional() }).strict();

export const commitar = z.object({ branch: ramo, caminho: z.string().min(3).max(300), conteudo: z.string().max(256 * 1024), mensagem: z.string().trim().min(3).max(200) }).strict().refine(p => caminhoDeTesteValido(p.caminho), 'caminho não permitido');

export const abrirPr = z.object({ branch: ramo, base: ramoBase.optional(), titulo: z.string().trim().min(3).max(200), corpo: z.string().max(8000).default(''), rascunho: z.boolean().default(true) }).strict();
