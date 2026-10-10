import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { carregarProjeto, mascarar, type Projeto } from './projeto.js';
import { diretorioDados } from './atividades.js';

/**
 * Vínculos locais: apenas a lista de raízes que a pessoa escolheu abrir no aplicativo.
 * O contrato continua sendo o qa.project.json do projeto; nada dele é copiado para cá.
 */
const arquivoSchema = z.object({ version: z.literal(1), projects: z.array(z.object({ root: z.string().min(1).max(1000), addedAt: z.string().datetime() }).strict()).max(200) }).strict();
export type Situacao = {
  root: string; state: 'INTEGRADO' | 'SEM_MANIFESTO' | 'MANIFESTO_INVALIDO' | 'PASTA_AUSENTE';
  id?: string; name?: string; capabilities?: string[]; readOnly?: boolean; message: string; instructions?: string;
};
export const instrucoesManifesto = 'Crie um arquivo qa.project.json (schemaVersion 2) na raiz do projeto, declarando context (documentation, tests, code), commands e execution.requireApproval=true. O Prumo não cria nem altera arquivos do projeto; veja a seção Ajuda › Integrar um projeto.';

/** Forma canônica para comparar: resolve links, 8.3 (RUNNER~1) e caixa, como o núcleo faz ao carregar o projeto. */
const canonica = (raiz: string) => { try { return fs.realpathSync.native(raiz).toLowerCase(); } catch { return String(raiz).toLowerCase(); } };
const arquivo = (base?: string) => path.join(diretorioDados(base), 'vinculos.json');
function ler(base?: string) {
  try { return arquivoSchema.parse(JSON.parse(fs.readFileSync(arquivo(base), 'utf8'))).projects; }
  catch (e) { if ((e as NodeJS.ErrnoException).code === 'ENOENT') return []; throw new Error('LINKS_INVALID: vinculos.json inválido; corrija ou remova o arquivo.'); }
}
function gravar(projects: { root: string; addedAt: string }[], base?: string) {
  const alvo = arquivo(base); fs.mkdirSync(path.dirname(alvo), { recursive: true, mode: 0o700 });
  const tmp = alvo + '.' + randomUUID() + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify({ version: 1, projects }, null, 2), { mode: 0o600 }); fs.renameSync(tmp, alvo);
}

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

export async function listarVinculos(base?: string) {
  return Promise.all(ler(base).map(async v => ({ ...(await situacaoProjeto(v.root)), addedAt: v.addedAt })));
}
/** Só vincula projeto com contrato válido; caso contrário devolve o diagnóstico e não grava nada. */
export async function adicionarVinculo(raiz: string, base?: string) {
  const s = await situacaoProjeto(raiz);
  if (s.state !== 'INTEGRADO') return { linked: false as const, situation: s };
  const atuais = ler(base);
  if (!atuais.some(v => canonica(v.root) === canonica(s.root))) gravar([...atuais, { root: s.root, addedAt: new Date().toISOString() }], base);
  return { linked: true as const, situation: s };
}
/** Remove apenas o vínculo; histórico, evidências e arquivos do projeto permanecem. */
export function removerVinculo(raiz: string, base?: string) {
  const atuais = ler(base); const alvo = canonica(raiz); const restantes = atuais.filter(v => canonica(v.root) !== alvo);
  if (restantes.length !== atuais.length) gravar(restantes, base);
  return { removed: restantes.length !== atuais.length };
}
/** Exige que a raiz tenha sido vinculada: a interface nunca abre pastas arbitrárias. */
export async function projetoVinculado(raiz: string, base?: string): Promise<Projeto> {
  if (typeof raiz !== 'string' || !ler(base).some(v => canonica(v.root) === canonica(raiz))) throw new Error('PROJECT_NOT_LINKED: selecione um projeto vinculado.');
  return carregarProjeto(raiz);
}
/** Copia o projeto de demonstração para uma pasta gravável (a instalação é somente leitura). */
export function copiarDemonstracao(origem: string, base?: string) {
  const destino = path.join(diretorioDados(base), 'demonstracao');
  if (fs.existsSync(destino)) return destino; // nunca sobrescreve
  fs.cpSync(origem, destino, { recursive: true, filter: s => !/[\\/]\.prumo([\\/]|$)/.test(s) && !/[\\/]node_modules([\\/]|$)/.test(s) });
  return destino;
}
