/** Apaga as conversas antigas gravadas de um projeto. */
import fs from 'node:fs';
import { arquivoDeConversas } from './arquivoDeConversas.js';
import { semLinks } from '../../compartilhado/seguranca/semLinks.js';

export function apagarConversas(espacoId: string | null, base?: string) { const alvo = arquivoDeConversas(espacoId, base); try { semLinks(alvo); fs.rmSync(alvo, { force: true }); return { apagado: true }; } catch { return { apagado: false }; } }
