/** Salva e consulta casos e suítes locais, mantendo seus vínculos. */
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { obterEspaco, atualizarEspaco } from "../projetos/banco/projetos.js";
import { mascarar } from "../compartilhado/seguranca/mascarar.js";
import { lerRepositorioLocal, gravarRepositorioLocal } from "./banco/local.js";
import { entradaCasoLocal, type CasoLocal, entradaSuiteLocal, dadosCasoLocal } from "./tipos/escritaQase.js";
import { listarPropostas } from "../tickets/banco/tickets.js";
import { repositorioLocalSchema } from "./tipos/escritaQase.js";

/** Mascara segredos e tira caracteres de controle e de inversão de direção do texto, que só servem para enganar a leitura. */
const limpar = (t: string) => mascarar(t).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u202A-\u202E\u2066-\u2069]/g, '');

export function salvarCasoLocal(entrada: z.input<typeof entradaCasoLocal>, base?: string) {
  const p = entradaCasoLocal.parse(entrada);
  const projeto = obterEspaco(p.espacoId, base);
  if(projeto.manualAtivo===false)throw new Error('MANUAL_DISABLED');
  const registro = lerRepositorioLocal(base);
  const originais = listarRepositorioLocal(p.espacoId, base);
  const anterior = p.id ? originais.casos.find(c => c.id === p.id) : undefined;
  if (p.id && !anterior) throw new Error('LOCAL_CASE_NOT_FOUND');
  if (p.suiteLocalId && !originais.suites.some(s => s.id === p.suiteLocalId)) throw new Error('LOCAL_SUITE_SCOPE');
  if (!anterior && registro.casos.filter(c => c.espacoId === p.espacoId).length >= 1000) throw new Error('LOCAL_CASE_LIMIT');
  if (p.dados.tags.some(t => mascarar(t) !== t)) throw new Error('TAG_SECRET: tags não podem conter chaves, tokens ou senhas');
  const agora = new Date().toISOString();
  const dados = { ...p.dados, titulo: limpar(p.dados.titulo), descricao: limpar(p.dados.descricao),
    preCondicoes: limpar(p.dados.preCondicoes), posCondicoes: limpar(p.dados.posCondicoes),
    passos: p.dados.passos.map(s => ({ ...s, acao: limpar(s.acao), esperado: limpar(s.esperado), dados: limpar(s.dados) })) };
  const maiorUsado = Math.max(0, ...registro.casos.filter(c => c.espacoId === p.espacoId).map(c => c.numero ?? 0));
  const numero = anterior?.numero ?? Math.max(registro.numeracao?.[p.espacoId] ?? 1, maiorUsado + 1);
  if (!anterior?.numero) registro.numeracao = { ...registro.numeracao, [p.espacoId]: numero + 1 };
  const atualizado: CasoLocal = {
    id: anterior?.id ?? randomUUID(), numero, espacoId: p.espacoId, tipo: 'caso', origem: 'PESSOA',
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
  if(projeto.manualAtivo===false)throw new Error('MANUAL_DISABLED');
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

/** Remove uma suíte só do Prumo (computador). As suítes filhas e os casos dela sobem para a suíte pai (ou para a raiz); nada mais é apagado e o Qase não é tocado. */
export function removerSuiteLocal(espacoId: string, id: string, base?: string) {
  const projeto = obterEspaco(espacoId, base);
  if (projeto.manualAtivo === false) throw new Error('MANUAL_DISABLED');
  const repo = lerRepositorioLocal(base);
  const alvo = repo.suites.find(s => s.id === id && s.espacoId === espacoId);
  if (!alvo) throw new Error('LOCAL_SUITE_NOT_FOUND');
  const agora = new Date().toISOString();
  for (const s of repo.suites) if (s.espacoId === espacoId && s.paiId === id) { s.paiId = alvo.paiId; s.atualizadaEm = agora; }
  let casosMovidos = 0;
  for (const c of repo.casos) if (c.espacoId === espacoId && c.suiteLocalId === id) { c.suiteLocalId = alvo.paiId; c.atualizadaEm = agora; casosMovidos += 1; }
  repo.suites = repo.suites.filter(s => s !== alvo);
  gravarRepositorioLocal(repo, base);
  return { removido: id, titulo: alvo.titulo, casosMovidos };
}

export function listarRepositorioLocal(espacoId: string, base?: string) {
  obterEspaco(espacoId, base);
  const repo = lerRepositorioLocal(base);
  const novos = repo.casos.filter(c => c.espacoId === espacoId);
  const ids = new Set(novos.map(c => c.id));
  const antigos = listarPropostas(espacoId, base)
    .filter(p => p.tipo === 'caso' && p.origem === 'PESSOA' && p.estado !== 'DESCARTADA' && !p.remoto && !ids.has(p.id))
    .map(p => ({
      id: p.id, numero: undefined as number | undefined, espacoId, tipo: 'caso' as const, origem: 'PESSOA' as const,
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

export function importarRepositorioLocal(espacoId: string, dados: unknown, base?: string) {
  const projeto = obterEspaco(espacoId, base);
  if (projeto.manualAtivo === false) throw new Error('MANUAL_DISABLED');
  const importado = repositorioLocalSchema.parse(dados);
  const registro = lerRepositorioLocal(base);
  if (registro.casos.filter(c => c.espacoId === espacoId).length + importado.casos.length > 1000) throw new Error('LOCAL_CASE_LIMIT');
  const agora = new Date().toISOString();
  const suites = new Map<string, string>();
  for (const suite of importado.suites) {
    const id = randomUUID(); suites.set(suite.id, id);
    registro.suites.push({ ...suite, id, espacoId, paiId: null, criadaEm: agora, atualizadaEm: agora });
  }
  importado.suites.forEach((suite, indice) => {
    const atual = registro.suites[registro.suites.length - importado.suites.length + indice];
    if (atual) atual.paiId = suite.paiId ? (suites.get(suite.paiId) ?? null) : null;
  });
  let numero = Math.max(0, ...(registro.casos.filter(c => c.espacoId === espacoId).map(c => c.numero ?? 0)), registro.numeracao?.[espacoId] ? registro.numeracao[espacoId] - 1 : 0);
  for (const caso of importado.casos) {
    numero += 1;
    registro.casos.push({ ...caso, id: randomUUID(), numero, espacoId, suiteLocalId: caso.suiteLocalId ? (suites.get(caso.suiteLocalId) ?? null) : null, criadaEm: agora, atualizadaEm: agora });
  }
  registro.numeracao = { ...registro.numeracao, [espacoId]: numero + 1 };
  gravarRepositorioLocal(registro, base);
  return { casos: importado.casos.length, suites: importado.suites.length };
}

/** Remove um caso só do Prumo (computador), junto com os vínculos declarados dele. O caso no Qase, se existir, não é tocado. */
export function removerCasoLocal(espacoId: string, id: string, base?: string) {
  obterEspaco(espacoId, base);
  const registro = lerRepositorioLocal(base);
  const alvo = registro.casos.find(c => c.id === id && c.espacoId === espacoId);
  if (!alvo) throw new Error('LOCAL_CASE_NOT_FOUND');
  registro.casos = registro.casos.filter(c => c !== alvo);
  gravarRepositorioLocal(registro, base);
  atualizarEspaco(espacoId, e => { e.relacoes = e.relacoes.filter(r => !((r.de.tipo === 'caso-local' && r.de.id === id) || (r.para.tipo === 'caso-local' && r.para.id === id))); }, base);
  return { removido: id, titulo: alvo.titulo };
}
