/** Cria/edita caso offline. Ao editar um legado, copia o mesmo ID para o arquivo novo sem apagar o original. */
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { obterEspaco } from '../../projetos/banco/obterEspaco.js';
import { mascarar } from '../../compartilhado/seguranca/mascarar.js';
import { listarRepositorioLocal } from './listarRepositorioLocal.js';
import { lerRepositorioLocal } from '../banco/lerRepositorioLocal.js';
import { gravarRepositorioLocal } from '../banco/gravarRepositorioLocal.js';
import { entradaCasoLocal, type CasoLocal } from '../tipos/repositorioLocal.js';

export function salvarCasoLocal(entrada: z.input<typeof entradaCasoLocal>, base?: string) {
  const p = entradaCasoLocal.parse(entrada);
  const projeto = obterEspaco(p.espacoId, base);
  if (projeto.vinculos.some(v => v.servico === 'qase')) throw new Error('LOCAL_CASE_QASE_LINKED');
  const registro = lerRepositorioLocal(base);
  const originais = listarRepositorioLocal(p.espacoId, base);
  const anterior = p.id ? originais.casos.find(c => c.id === p.id) : undefined;
  if (p.id && !anterior) throw new Error('LOCAL_CASE_NOT_FOUND');
  if (p.suiteLocalId && !originais.suites.some(s => s.id === p.suiteLocalId)) throw new Error('LOCAL_SUITE_SCOPE');
  if (!anterior && registro.casos.length >= 500) throw new Error('LOCAL_CASE_LIMIT');
  const agora = new Date().toISOString();
  const dados = { ...p.dados, titulo: mascarar(p.dados.titulo), descricao: mascarar(p.dados.descricao),
    preCondicoes: mascarar(p.dados.preCondicoes), posCondicoes: mascarar(p.dados.posCondicoes),
    passos: p.dados.passos.map(s => ({ acao: mascarar(s.acao), esperado: mascarar(s.esperado), dados: mascarar(s.dados) })) };
  const atualizado: CasoLocal = {
    id: anterior?.id ?? randomUUID(), espacoId: p.espacoId, tipo: 'caso', origem: 'PESSOA',
    titulo: dados.titulo, dados, requisito: mascarar(p.requisito ?? anterior?.requisito ?? ''), risco: mascarar(p.risco ?? anterior?.risco ?? ''),
    referenciasLegadas: anterior?.referenciasLegadas,
    suiteLocalId: p.suiteLocalId === undefined ? (anterior?.suiteLocalId ?? null) : p.suiteLocalId,
    criadaEm: anterior?.criadaEm ?? agora, atualizadaEm: agora
  };
  const idx = registro.casos.findIndex(c => c.id === atualizado.id);
  if (idx >= 0 && registro.casos[idx]?.espacoId !== p.espacoId) throw new Error('LOCAL_CASE_SCOPE');
  if (idx >= 0) registro.casos[idx] = atualizado; else registro.casos.push(atualizado);
  gravarRepositorioLocal(registro, base);
  return atualizado;
}
