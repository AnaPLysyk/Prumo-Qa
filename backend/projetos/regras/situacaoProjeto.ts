/** Diz em que estado está uma pasta: integrada, sem contrato, com contrato inválido ou inexistente. */
import fs from 'node:fs';
import path from 'node:path';
import { carregarProjeto } from '../../compartilhado/projeto/carregarProjeto.js';
import { mascarar } from '../../compartilhado/seguranca/mascarar.js';
import { Situacao, instrucoesManifesto } from '../tipos/pastasVinculadas.js';

/** Diagnostica uma pasta sem escrever nada nela. */
export async function situacaoProjeto(raiz: string): Promise<Situacao> {
  if (typeof raiz !== 'string' || !path.isAbsolute(raiz)) return { root: String(raiz).slice(0, 300), state: 'PASTA_AUSENTE', message: 'Informe um caminho absoluto.' };
  let real: string;
  try { real = await fs.promises.realpath(raiz); if (!(await fs.promises.stat(real)).isDirectory()) throw new Error(); }
  catch { return { root: raiz, state: 'PASTA_AUSENTE', message: 'A pasta não existe ou não é acessível.' }; }
  try { await fs.promises.access(path.join(real, 'qa.project.json')); }
  catch { return { root: real, state: 'SEM_MANIFESTO', message: 'Pasta sem qa.project.json: projeto ainda não integrado.', instructions: instrucoesManifesto }; }
  try {
    const p = await carregarProjeto(real);
    return { root: p.raiz, state: 'INTEGRADO', id: p.manifesto.id, name: p.manifesto.name, capabilities: Object.keys(p.manifesto.commands), readOnly: p.manifesto.execution.readOnly, message: 'Contrato v2 válido.' };
  } catch (e) { return { root: real, state: 'MANIFESTO_INVALIDO', message: mascarar((e as Error).message), instructions: instrucoesManifesto }; }
}
