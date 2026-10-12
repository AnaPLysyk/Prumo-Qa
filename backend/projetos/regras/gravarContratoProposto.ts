/** Grava o qa.project.json aprovado pela pessoa, sem sobrescrever; se não passar na validação, apaga. */
import fs from 'node:fs';
import path from 'node:path';
import { carregarProjeto } from '../../compartilhado/projeto/carregarProjeto.js';
import { PropostaContrato } from '../tipos/contrato.js';

/** Grava a proposta aprovada sem sobrescrever nada e confere com o mesmo validador do núcleo; se não passar, desfaz. */
export async function gravarContratoProposto(p: PropostaContrato) {
  const alvo = path.join(p.raiz, 'qa.project.json');
  fs.writeFileSync(alvo, JSON.stringify(p.manifesto, null, 2) + '\n', { flag: 'wx' });
  try { return await carregarProjeto(p.raiz); }
  catch (e) { fs.rmSync(alvo, { force: true }); throw e; }
}
