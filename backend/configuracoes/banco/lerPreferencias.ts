/** Lê as preferências da pessoa; se faltarem ou estiverem inválidas, usa o padrão seguro. */
import fs from 'node:fs';
import { semLinks } from '../../compartilhado/seguranca/semLinks.js';
import { arquivoDePreferencias } from './arquivoDePreferencias.js';
import { Preferencias, padrao, preferenciasSchema } from '../tipos/configuracoes.js';

export function lerPreferencias(base?: string): Preferencias {
  try { semLinks(arquivoDePreferencias(base)); return preferenciasSchema.parse(JSON.parse(fs.readFileSync(arquivoDePreferencias(base), 'utf8'))); } catch { return { ...padrao }; }
}
