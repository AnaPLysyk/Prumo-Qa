/** Lê se a pessoa permitiu enviar os contextos à IA (padrão: não). */
import fs from 'node:fs';
import path from 'node:path';
import { semLinks } from '../../compartilhado/seguranca/semLinks.js';
import { Projeto } from '../../compartilhado/tipos/projeto.js';
import { pastaContextos } from './pastaContextos.js';
import { configSchema } from '../tipos/contexto.js';

export function lerPermissaoDeContextosNoMcp(p: Projeto, base?: string): { disponibilizarAoMcp: boolean } {
  try { const alvo = path.join(pastaContextos(p, base), 'config.json'); semLinks(alvo); const c = configSchema.parse(JSON.parse(fs.readFileSync(alvo, 'utf8'))); return { disponibilizarAoMcp: c.disponibilizarAoMcp }; }
  catch { return { disponibilizarAoMcp: false }; } // padrão seguro: não disponibiliza
}
