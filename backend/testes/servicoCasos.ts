/** Salva e consulta casos e suítes locais, mantendo seus vínculos. */
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { obterEspaco } from "../projetos/banco/projetos.js";
import { mascarar } from "../compartilhado/seguranca/mascarar.js";
import { lerRepositorioLocal, gravarRepositorioLocal } from "./banco/local.js";
import { entradaCasoLocal, type CasoLocal, entradaSuiteLocal, dadosCasoLocal } from "./tipos/repositorioLocal.js";
import { listarPropostas } from "../tickets/banco/tickets.js";

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

export function listarRepositorioLocal(espacoId: string, base?: string) {
  obterEspaco(espacoId, base);
  const repo = lerRepositorioLocal(base);
  const novos = repo.casos.filter(c => c.espacoId === espacoId);
  const ids = new Set(novos.map(c => c.id));
  const antigos = listarPropostas(espacoId, base)
    .filter(p => p.tipo === 'caso' && p.origem === 'PESSOA' && p.estado !== 'DESCARTADA' && !p.remoto && !ids.has(p.id))
    .map(p => ({
      id: p.id, espacoId, tipo: 'caso' as const, origem: 'PESSOA' as const,
      titulo: p.titulo, dados: dadosCasoLocal.parse((({ suiteId: _suite, ticket: _ticket, ...dados }) => dados)(p.dados as Record<string, unknown>)), requisito: p.requisito, risco: p.risco,
      suiteLocalId: null,
      // Referências textuais da proposta original são históricas; não declaram um vínculo verificado no Jira/Qase.
      referenciasLegadas: {
        ...(typeof p.dados.ticket === 'string' ? { ticket: p.dados.ticket } : {}),
        ...(typeof p.dados.suiteId === 'number' && Number.isSafeInteger(p.dados.suiteId) && p.dados.suiteId > 0 ? { suiteId: p.dados.suiteId } : {})
      },
      criadaEm: p.criadaEm, atualizadaEm: p.atualizadaEm,
      legado: true
    }));
  return {
    casos: [...novos, ...antigos].sort((a, b) => b.atualizadaEm.localeCompare(a.atualizadaEm)),
    suites: repo.suites.filter(s => s.espacoId === espacoId)
  };
}
