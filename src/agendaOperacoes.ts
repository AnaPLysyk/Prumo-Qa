import { listarRotinas, obterRotina, proximoSlot, dadosRotinaSchema, type Rotina, type DadosRotina } from './agenda.js';
import { listarTrabalhos } from './fila.js';
import { obterEspaco } from './espacos.js';
import { carregarProjeto, ErroQa } from './projeto.js';
import { escopoDeCapability } from './execucao.js';
import { escopoK6, localizarK6, capabilityK6, type ExecutavelK6 } from './k6.js';
import { obterRunLocal } from './fluxoQase.js';
import { autorizarEscopo, listarAutorizacoes, estadoExecucao, estadoPublicacao, type Solicitador } from './autorizacoes.js';

/**
 * Operações de aplicação sobre rotinas (2.8): o que a janela e a bandeja pedem, sem Electron, para ser testável.
 * A aprovação humana acontece pelo `solicitar` injetado (broker nativo do Windows em produção).
 */
export function capacidadesDaRotina(r: Rotina, base?: string): string[] {
  if (r.tipo === 'smoke' || r.tipo === 'regressao') return r.capability ? [r.capability] : [];
  if (r.tipo === 'k6') return r.k6 ? [capabilityK6(r.k6)] : [];
  if (r.tipo === 'run-qase') { try { return [...new Set(obterRunLocal(r.runLocalId!, base).casos.map(c => c.capability).filter((c): c is string => !!c))]; } catch { return []; } }
  if (r.tipo === 'validacao-ticket') { const e = obterEspaco(r.espacoId, base); return [...new Set(e.relacoes.filter(x => x.de.tipo === 'jira' && x.de.id === r.ticket && x.para.tipo === 'automacao').map(x => x.para.id))].slice(0, 5); }
  return [];
}
/** O que a rotina PODE fazer, em palavras simples, para a pessoa conferir antes de autorizar. */
export function permissoesDaRotina(r: Rotina, base?: string) {
  const caps = capacidadesDaRotina(r, base); const p: string[] = [];
  if (r.tipo === 'consulta-jira') p.push('Lê tickets do Jira vinculado ao projeto (somente leitura).');
  else if (r.tipo === 'analise-mudancas') p.push('Lê commits do repositório GitHub vinculado (somente leitura). Não dispara execuções.');
  else if (r.tipo === 'run-qase') p.push(caps.length ? `Executa localmente ${caps.map(c => `"${c}"`).join(', ')} (automações dos casos da run) e tenta publicar os resultados na run do Qase. Só publica com uma política de publicação aprovada para essa run; sem ela, os resultados ficam locais.` : 'A run não tem automação associada: nada será executado.');
  else if (r.tipo === 'k6') p.push(`Executa o k6 oficial contra ${r.k6?.alvo} (${r.k6?.usuarios} usuário(s) virtual(is), ${r.k6?.duracaoSegundos}s) com o script ${r.k6?.script}.`);
  else if (caps.length) p.push(`Executa localmente ${caps.map(c => `"${c}"`).join(', ')}, comando já declarado no contrato do projeto. Nenhum comando novo pode ser criado pela agenda.`);
  else p.push('Não há automação associada: nada será executado.');
  if (r.ticket) p.push(`Ticket associado: ${r.ticket}. Comentário no Jira só com política de publicação aprovada.`);
  return p;
}

export function listarAgenda(espacoId?: string, base?: string, agora = new Date()) {
  const trab = listarTrabalhos(base); const aut = listarAutorizacoes(base);
  return listarRotinas(base).filter(r => !espacoId || r.espacoId === espacoId).map(r => {
    const meus = trab.filter(t => t.rotinaId === r.id && t.estado !== 'PERDIDO'); const ultimo = meus.filter(t => t.terminadoEm).sort((a, b) => b.terminadoEm!.localeCompare(a.terminadoEm!))[0];
    const caps = capacidadesDaRotina(r, base);
    const autorizacoes = caps.map(c => { const a = aut.execucoes.filter(x => x.espacoId === r.espacoId && x.capability === c && x.ambiente === r.ambiente).sort((p, q) => q.criadaEm.localeCompare(p.criadaEm))[0]; return { capability: c, estado: a ? estadoExecucao(a, agora) : 'AUSENTE', id: a?.id ?? null, validaAte: a?.validaAte ?? null, usos: a ? `${a.usos}/${a.maxUsos}` : null }; });
    const proximo = r.estado === 'ATIVA' ? proximoSlot(r, agora.getTime()) : null;
    return { ...r, proximaExecucao: proximo ? new Date(proximo).toISOString() : null, ultimaExecucao: ultimo ? { id: ultimo.id, em: ultimo.terminadoEm, estado: ultimo.estado, resultado: ultimo.resultado?.status ?? null, motivo: ultimo.resultado?.motivo ?? ultimo.erro } : null,
      permissoes: permissoesDaRotina(r, base), autorizacoes, erros: meus.filter(t => t.estado === 'ERRO' || t.resultado?.status === 'ERRO_INFRA' || t.resultado?.status === 'BLOCKED').slice(-5).map(t => ({ id: t.id, codigo: t.erro ?? t.resultado?.status, motivo: t.resultado?.motivo ?? '' })) };
  });
}
export function listarPermissoes(espacoId?: string, base?: string, agora = new Date()) {
  const a = listarAutorizacoes(base);
  return { execucoes: a.execucoes.filter(x => !espacoId || x.espacoId === espacoId).map(x => ({ ...x, estado: estadoExecucao(x, agora) })), publicacoes: a.publicacoes.filter(x => !espacoId || x.espacoId === espacoId).map(x => ({ ...x, estado: estadoPublicacao(x, agora) })) };
}

/** Pede ao broker nativo o consentimento para cada automação da rotina (escopo exato) e grava as autorizações. */
export async function autorizarRotina(rotinaId: string, opcoes: { dias: number; maxUsos: number }, solicitar: Solicitador, base?: string, exe?: ExecutavelK6 | null) {
  const r = obterRotina(rotinaId, base); const e = obterEspaco(r.espacoId, base);
  if (!['smoke', 'regressao', 'validacao-ticket', 'k6', 'run-qase'].includes(r.tipo)) throw new ErroQa('AUTH_NOT_REQUIRED', 'Este tipo de rotina só lê dados e não precisa de autorização de execução.');
  if (!e.pastaLocal) throw new ErroQa('PROJECT_FOLDER_REQUIRED', 'Vincule uma pasta de automação ao projeto antes de autorizar execuções.');
  const p = await carregarProjeto(e.pastaLocal); const criadas = [];
  if (r.tipo === 'k6') {
    const k = exe ?? (await localizarK6().then(c => (c ? { executable: c } : null))); if (!k || !r.k6) throw new ErroQa('RUNTIME_MISSING', 'k6 não encontrado no PATH.');
    criadas.push(await autorizarEscopo(p, e.id, capabilityK6(r.k6), r.ambiente, await escopoK6(p, r.k6, r.ambiente, k), opcoes, base, solicitar));
  } else {
    const caps = capacidadesDaRotina(r, base); if (!caps.length) throw new ErroQa('NO_VERIFIED_LINK', 'Não há automação associada a esta rotina.');
    for (const c of caps) criadas.push(await autorizarEscopo(p, e.id, c, r.ambiente, await escopoDeCapability(p, c), opcoes, base, solicitar));
  }
  return criadas.map(a => ({ id: a.id, capability: a.capability, validaAte: a.validaAte, maxUsos: a.maxUsos }));
}

/** Valida o que o esquema sozinho não vê: projeto existe, pasta de automação, capability declarada e vínculos exigidos. */
export async function validarRotina(dados: DadosRotina, base?: string) {
  const d = dadosRotinaSchema.parse(dados); const e = obterEspaco(d.espacoId, base);
  if (d.tipo === 'run-qase') { const run = obterRunLocal(d.runLocalId!, base); if (run.espacoId !== d.espacoId) throw new ErroQa('RUN_PROJECT_MISMATCH', 'A run pertence a outro projeto.'); if (!run.runIdRemoto) throw new ErroQa('RUN_NOT_CREATED', 'Crie a run no Qase antes de agendá-la.'); }
  if (['smoke', 'regressao', 'validacao-ticket', 'k6', 'run-qase'].includes(d.tipo) && !e.pastaLocal) throw new ErroQa('PROJECT_FOLDER_REQUIRED', 'Este tipo de rotina executa testes e precisa de uma pasta de automação vinculada ao projeto.');
  if (d.capability && e.pastaLocal) { const p = await carregarProjeto(e.pastaLocal); if (!Object.hasOwn(p.manifesto.commands, d.capability)) throw new ErroQa('CAPABILITY_NOT_ALLOWED', `A capability "${d.capability}" não está declarada no contrato do projeto.`); }
  if (d.tipo === 'consulta-jira' && !e.vinculos.some(v => v.servico === 'jira')) throw new ErroQa('JIRA_LINK_REQUIRED', 'Vincule um projeto Jira antes de agendar consultas.');
  if (d.tipo === 'analise-mudancas' && !e.vinculos.some(v => v.servico === 'github')) throw new ErroQa('GITHUB_LINK_REQUIRED', 'Vincule um repositório GitHub antes de agendar a análise de mudanças.');
  return d;
}
