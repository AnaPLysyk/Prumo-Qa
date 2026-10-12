/** Resume os dados do Prumo neste computador por categoria (tamanho e arquivos), para Ajuda › Privacidade e dados. */
import fs from 'node:fs';
import path from 'node:path';
import { medirPasta } from './medirPasta.js';
import { categorias, limitesPrivacidade, naoTransmitido, politicaRetencao } from '../tipos/privacidade.js';
import { diretorioDados } from '../../compartilhado/banco/diretorioDados.js';
import { listarVinculos } from '../../projetos/regras/listarVinculos.js';

export async function resumirDados(base?: string) {
  const dir = diretorioDados(base); const por: Record<string, { bytes: number; files: number }> = {};
  let total = 0, truncado = false;
  let itens: fs.Dirent[] = []; try { itens = fs.readdirSync(dir, { withFileTypes: true }); } catch { /* ainda sem dados */ }
  for (const i of itens) {
    if (i.isSymbolicLink()) continue;
    const alvo = path.join(dir, i.name); const cat = categorias[i.name] ?? 'outros';
    const r = i.isDirectory() ? medirPasta(alvo) : { bytes: (() => { try { return fs.statSync(alvo).size; } catch { return 0; } })(), arquivos: 1, truncado: false };
    por[cat] = { bytes: (por[cat]?.bytes ?? 0) + r.bytes, files: (por[cat]?.files ?? 0) + r.arquivos }; total += r.bytes; truncado ||= r.truncado;
  }
  return { directory: dir, linkedProjects: (await listarVinculos(base)).length, totalBytes: total, truncated: truncado, categories: por,
    evidenceNote: 'Evidências de execução ficam em <projeto>\\.prumo\\evidencias, dentro de cada projeto vinculado, e não entram neste total.',
    retention: politicaRetencao, notTransmitted: naoTransmitido, privacyLimits: limitesPrivacidade };
}
