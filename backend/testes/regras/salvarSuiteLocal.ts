/** Cria/edita suítes locais com escopo por projeto e recusa árvore cíclica. */
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { obterEspaco } from '../../projetos/banco/obterEspaco.js';
import { mascarar } from '../../compartilhado/seguranca/mascarar.js';
import { lerRepositorioLocal } from '../banco/lerRepositorioLocal.js';
import { gravarRepositorioLocal } from '../banco/gravarRepositorioLocal.js';
import { entradaSuiteLocal } from '../tipos/repositorioLocal.js';

export function salvarSuiteLocal(entrada: z.input<typeof entradaSuiteLocal>, base?: string) {
  const p = entradaSuiteLocal.parse(entrada); const projeto = obterEspaco(p.espacoId, base);
  if (projeto.vinculos.some(v => v.servico === 'qase')) throw new Error('LOCAL_SUITE_QASE_LINKED');
  const repo = lerRepositorioLocal(base);
  const atual = p.id ? repo.suites.find(s => s.id === p.id && s.espacoId === p.espacoId) : undefined;
  if (p.id && !atual) throw new Error('LOCAL_SUITE_NOT_FOUND');
  if (!atual && repo.suites.length >= 100) throw new Error('LOCAL_SUITE_LIMIT');
  const paiId = p.paiId === undefined ? (atual?.paiId ?? null) : p.paiId;
  if (paiId) {
    const vistas = new Set<string>([p.id ?? '']);
    let cursor: string | null = paiId;
    while (cursor) {
      if (vistas.has(cursor)) throw new Error('LOCAL_SUITE_CYCLE');
      vistas.add(cursor);
      const pai = repo.suites.find(s => s.id === cursor && s.espacoId === p.espacoId);
      if (!pai) throw new Error('LOCAL_SUITE_SCOPE');
      cursor = pai.paiId;
    }
  }
  const agora = new Date().toISOString();
  const item = { id: atual?.id ?? randomUUID(), espacoId: p.espacoId,
    titulo: mascarar(p.titulo), descricao: mascarar(p.descricao), paiId, criadaEm: atual?.criadaEm ?? agora, atualizadaEm: agora };
  const index = repo.suites.findIndex(s => s.id === item.id);
  if (index < 0) repo.suites.push(item); else repo.suites[index] = item;
  gravarRepositorioLocal(repo, base);
  return item;
}
