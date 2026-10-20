/** Publica uma proposta: cria o caso no Qase, o bug no Jira, o defeito no Qase ou a issue no GitHub, e marca como publicada. */
import { executarOperacao } from '../../conexoes/escrita/executarOperacao.js';
import { Executor } from '../../conexoes/tipos/operacoesExternas.js';
import { obterEspaco } from '../../projetos/banco/obterEspaco.js';
import { associarEspaco } from '../../projetos/regras/associarEspaco.js';
import { obterProposta } from '../banco/obterProposta.js';

import { podePublicar } from './podePublicar.js';
import { Proposta } from '../tipos/proposta.js';
import { alterarProposta } from '../banco/alterarProposta.js';

const marcarPublicada = (id: string, remoto: { id?: string; chave?: string; url?: string }, b?: string) => alterarProposta(id, p => { p.estado = 'PUBLICADA'; p.remoto = remoto; }, b);


/** Parâmetros da issue no GitHub a partir do rascunho local: o mesmo objeto alimenta a prévia confirmada e o envio. */
export function parametrosDaIssueGithub(p: Proposta) {
  const descricao = typeof p.dados.descricao === 'string' ? p.dados.descricao.trim() : '';
  const falha = p.falhaDeOrigem ? `\n\nFalha de origem: caso ${p.falhaDeOrigem.casoId} na run local ${p.falhaDeOrigem.runLocalId}.` : '';
  // Rótulos padrão do GitHub (bug / enhancement) mais os do rascunho; sem permissão de push o GitHub os descarta e o registro diz isso.
  const extras = Array.isArray(p.dados.rotulos) ? p.dados.rotulos.filter((r): r is string => typeof r === 'string') : [];
  const rotulos = [...new Set([p.dados.classificacao === 'MELHORIA' ? 'enhancement' : 'bug', ...extras])].slice(0, 10);
  return { titulo: String(p.dados.resumo ?? ''), corpo: (descricao + falha).slice(0, 60000), rotulos };
}

/** Opções do defeito Qase escolhidas no rascunho: severidade (ID do campo de sistema), milestone e campos personalizados. */
type OpcoesDefeitoQase = { severidadeQase?: number; marcoQase?: number; camposQase?: Record<string, string> };

/** Parâmetros do defeito no Qase a partir do rascunho local: o mesmo objeto alimenta a prévia confirmada e o envio. */
export function parametrosDoDefeitoQase(p: Proposta, o: OpcoesDefeitoQase) {
  if (p.dados.classificacao === 'MELHORIA') throw new Error('DEFECT_TYPE_INVALID: melhoria não é defeito Qase. Escolha Jira, GitHub Issues ou mantenha o rascunho.');
  const resultadoAtual = typeof p.dados.descricao === 'string' ? p.dados.descricao.trim() : '';
  if (resultadoAtual.length < 3) throw new Error('DEFECT_RESULT_REQUIRED: descreva o resultado observado.');
  return { titulo: String(p.dados.resumo ?? ''), resultadoAtual, severidade: o.severidadeQase ?? 3, ...(o.marcoQase ? { marcoId: o.marcoQase } : {}), campos: o.camposQase ?? {} };
}

/**
 * Publicação de uma proposta (a pessoa decidiu): vira a operação externa correspondente (caso Qase, ticket Jira, defeito Qase ou issue GitHub), marca a proposta
 * como publicada com o identificador remoto e registra o vínculo como REGISTRADO_PELO_PRUMO. Idempotente: a chave da operação vem do conteúdo.
 */
export async function publicarProposta(ex: Executor, id: string, o: { confirmado: boolean; tipoId?: string; destino?: 'jira' | 'qase' | 'github'; severidadeQase?: number; marcoQase?: number; camposQase?: Record<string, string>; base?: string }) {
  const b = o.base; const p = obterProposta(id, b); podePublicar(p); const e = obterEspaco(p.espacoId, b);
  if (p.tipo === 'caso') {
    const reg = await executarOperacao(ex, p.espacoId, 'qase.criar_caso', p.dados, { base: b, confirmado: o.confirmado });
    if (reg.estado === 'CONFIRMADA' && reg.remoto?.id) {
      marcarPublicada(id, { id: reg.remoto.id, chave: reg.remoto.chave }, b);
      const ticket = typeof p.dados.ticket === 'string' ? p.dados.ticket : null; const jv = e.vinculos.find(v => v.servico === 'jira'); const qv = e.vinculos.find(v => v.servico === 'qase');
      if (ticket && jv && qv) { try { associarEspaco(p.espacoId, { de: { tipo: 'jira', id: ticket, vinculoId: jv.id, origem: jv.recurso.instancia }, para: { tipo: 'qase', id: reg.remoto.id, vinculoId: qv.id, origem: qv.recurso.chave }, justificativa: 'Caso criado pelo Prumo a partir do ticket (proposta publicada)' }, b, true); } catch (erro) { if ((erro as Error).message !== 'TRACE_DUPLICATE') throw erro; /* vínculo já existente */ } }
    }
    return reg;
  }
  if (o.destino === 'github') {
    // Issue no GitHub: rastreador do repositório. Não é GitHub Actions: criar a issue não dispara pipeline.
    const reg = await executarOperacao(ex, p.espacoId, 'github.criar_issue', parametrosDaIssueGithub(p), { base: b, confirmado: o.confirmado });
    if (reg.estado === 'CONFIRMADA' && reg.remoto?.chave) marcarPublicada(id, { id: reg.remoto.id, chave: reg.remoto.chave, url: reg.remoto.url }, b);
    return reg;
  }
  if (o.destino === 'qase') {
    const reg = await executarOperacao(ex, p.espacoId, 'qase.criar_defeito', parametrosDoDefeitoQase(p, o), { base: b, confirmado: o.confirmado });
    if (reg.estado === 'CONFIRMADA' && reg.remoto?.id) {
      marcarPublicada(id, { id: reg.remoto.id, chave: reg.remoto.chave }, b);
      const vq = e.vinculos.find(v => v.servico === 'qase');
      if (p.falhaDeOrigem && vq) { try {
        associarEspaco(p.espacoId, { de: { tipo: 'qase-defeito', id: reg.remoto.id, vinculoId: vq.id, origem: vq.recurso.chave },
          para: { tipo: 'qase', id: String(p.falhaDeOrigem.casoId), vinculoId: vq.id, origem: vq.recurso.chave },
          justificativa: 'Defeito Qase publicado a partir de uma falha de run no Prumo' }, b, true);
      } catch (erro) { if ((erro as Error).message !== 'TRACE_DUPLICATE') throw erro; } }
    }
    return reg;
  }
  const tipoId = o.tipoId ?? (typeof p.dados.tipoId === 'string' ? p.dados.tipoId : undefined); if (!tipoId) throw new Error('ISSUE_TYPE_REQUIRED: escolha o tipo do ticket (ex.: Bug) antes de publicar.');
  const reg = await executarOperacao(ex, p.espacoId, 'jira.criar_ticket', { tipoId, resumo: p.dados.resumo, descricao: p.dados.descricao ?? '', rotulos: p.dados.rotulos ?? [], ...(p.dados.origem ? { origem: p.dados.origem } : {}) }, { base: b, confirmado: o.confirmado });
  if (reg.estado === 'CONFIRMADA' && reg.remoto?.chave) {
    marcarPublicada(id, { id: reg.remoto.id, chave: reg.remoto.chave, url: reg.remoto.url }, b);
    const jv = e.vinculos.find(v => v.servico === 'jira'); const qv = e.vinculos.find(v => v.servico === 'qase');
    if (p.falhaDeOrigem && jv && qv) { try { associarEspaco(p.espacoId, { de: { tipo: 'jira-bug', id: reg.remoto.chave, vinculoId: jv.id, origem: jv.recurso.instancia }, para: { tipo: 'qase', id: String(p.falhaDeOrigem.casoId), vinculoId: qv.id, origem: qv.recurso.chave }, justificativa: 'Bug aberto pelo Prumo a partir da falha na run' }, b, true); } catch (erro) { if ((erro as Error).message !== 'TRACE_DUPLICATE') throw erro; /* vínculo já existente */ } }
  }
  return reg;
}
