/** Lê as conversas antigas gravadas de um projeto. */
import fs from 'node:fs';
import { arquivoDeConversas } from './arquivoDeConversas.js';
import { RegistroConversa, limitesConversa, registro } from '../tipos/conversas.js';
import { semLinks } from '../../compartilhado/seguranca/semLinks.js';

export function lerConversas(espacoId: string | null, base?: string): RegistroConversa[] {
  const alvo = arquivoDeConversas(espacoId, base);
  try { semLinks(alvo); const st = fs.statSync(alvo); if (!st.isFile() || st.size > limitesConversa.bytes * 2) return []; } catch { return []; }
  const saida: RegistroConversa[] = [];
  for (const linha of fs.readFileSync(alvo, 'utf8').split('\n')) { if (!linha.trim()) continue; try { saida.push(registro.parse(JSON.parse(linha))); } catch { /* linha inválida ignorada */ } }
  return saida;
}
