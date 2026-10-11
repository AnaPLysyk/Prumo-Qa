import path from 'node:path';
import { associarEspaco, obterEspaco } from './espacos.js';
import { executarOperacao, type Executor } from './operacoesExternas.js';
import { obterProposta, podePublicar, marcarPublicada } from './propostas.js';
import type { Auxiliar } from './operacoesTipos.js';

/**
 * Publicação de uma proposta (a pessoa decidiu): vira a operação externa correspondente (criar caso no Qase ou ticket no Jira), marca a proposta
 * como publicada com o identificador remoto e registra o vínculo como REGISTRADO_PELO_PRUMO. Idempotente: a chave da operação vem do conteúdo.
 */
export async function publicarProposta(ex: Executor, id: string, o: { confirmado: boolean; tipoId?: string; base?: string }) {
  const b = o.base; const p = obterProposta(id, b); podePublicar(p); const e = obterEspaco(p.espacoId, b);
  if (p.tipo === 'caso') {
    const reg = await executarOperacao(ex, p.espacoId, 'qase.criar_caso', p.dados, { base: b, confirmado: o.confirmado });
    if (reg.estado === 'CONFIRMADA' && reg.remoto?.id) {
      marcarPublicada(id, { id: reg.remoto.id, chave: reg.remoto.chave }, b);
      const ticket = typeof p.dados.ticket === 'string' ? p.dados.ticket : null; const jv = e.vinculos.find(v => v.servico === 'jira'); const qv = e.vinculos.find(v => v.servico === 'qase');
      if (ticket && jv && qv) { try { associarEspaco(p.espacoId, { de: { tipo: 'jira', id: ticket, vinculoId: jv.id, origem: jv.recurso.instancia }, para: { tipo: 'qase', id: reg.remoto.id, vinculoId: qv.id, origem: qv.recurso.chave }, justificativa: 'Caso criado pelo Prumo a partir do ticket (proposta publicada)' }, b, true); } catch { /* relação já existente */ } }
    }
    return reg;
  }
  const tipoId = o.tipoId ?? (typeof p.dados.tipoId === 'string' ? p.dados.tipoId : undefined); if (!tipoId) throw new Error('ISSUE_TYPE_REQUIRED: escolha o tipo do ticket (ex.: Bug) antes de publicar.');
  const reg = await executarOperacao(ex, p.espacoId, 'jira.criar_ticket', { tipoId, resumo: p.dados.resumo, descricao: p.dados.descricao ?? '', rotulos: p.dados.rotulos ?? [], ...(p.dados.origem ? { origem: p.dados.origem } : {}) }, { base: b, confirmado: o.confirmado });
  if (reg.estado === 'CONFIRMADA' && reg.remoto?.chave) {
    marcarPublicada(id, { id: reg.remoto.id, chave: reg.remoto.chave, url: reg.remoto.url }, b);
    const jv = e.vinculos.find(v => v.servico === 'jira'); const qv = e.vinculos.find(v => v.servico === 'qase');
    if (p.falhaDeOrigem && jv && qv) { try { associarEspaco(p.espacoId, { de: { tipo: 'jira-bug', id: reg.remoto.chave, vinculoId: jv.id, origem: jv.recurso.instancia }, para: { tipo: 'qase', id: String(p.falhaDeOrigem.casoId), vinculoId: qv.id, origem: qv.recurso.chave }, justificativa: 'Bug aberto pelo Prumo a partir da falha na run' }, b, true); } catch { /* relação já existente */ } }
  }
  return reg;
}
/** Anexos: a página só indica "evidência de uma execução" ou "escolher arquivo"; o caminho vem do projeto ou do diálogo nativo, nunca da página. */
export function resolverAnexo(espacoId: string, anexo: { tipo: 'evidencia'; jobId: string } | { tipo: 'arquivo' }, caminhoEscolhido: string | null, b?: string): { arquivo: string; aux: Auxiliar } {
  const e = obterEspaco(espacoId, b); const raizes = e.pastaLocal ? [path.join(e.pastaLocal, '.prumo', 'evidencias'), path.join(e.pastaLocal, '.prumo', 'resultados'), path.join(e.pastaLocal, '.prumo', 'artefatos')] : [];
  if (anexo.tipo === 'evidencia') { if (!e.pastaLocal) throw new Error('PROJECT_FOLDER_REQUIRED: o projeto não tem pasta de automação para localizar a evidência.'); return { arquivo: path.join(raizes[0]!, `${anexo.jobId}.json`), aux: { arquivosAutorizados: [], raizesDeEvidencia: raizes } }; }
  if (!caminhoEscolhido) throw new Error('ATTACHMENT_NOT_CHOSEN: nenhum arquivo foi escolhido.'); return { arquivo: caminhoEscolhido, aux: { arquivosAutorizados: [caminhoEscolhido], raizesDeEvidencia: raizes } };
}
