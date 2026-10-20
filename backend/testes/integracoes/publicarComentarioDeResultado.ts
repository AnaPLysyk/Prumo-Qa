/** Publica o comentário de resultado no Jira uma única vez (confere se já existe pelo marcador) e registra o resultado. */
import { createHash } from 'node:crypto';
import { consumirPublicacao } from '../../agendamentos/autorizacoes/politicasDaAutorizacao.js';
import { definirEstadoJiraDoTrabalho } from '../../agendamentos/banco/armazenamentoDaFila.js';
import { obterTrabalho } from '../../agendamentos/banco/armazenamentoDaFila.js';
import { gravarPublicacoesJira } from '../banco/publicacoesJira.js';
import { lerPublicacoesJira } from '../banco/publicacoesJira.js';
import { codigoDoErroDePublicacao } from '../regras/codigoDoErroDePublicacao.js';
import { montarComentario } from '../regras/montarComentario.js';
import { publicacaoPodeRepetir } from '../regras/publicacaoPodeRepetir.js';
import { Pub, PublicadorJira, registroPub } from '../tipos/comentarioJira.js';
import { obterEspaco } from '../../projetos/banco/obterEspaco.js';

/**
 * Publica (ou confirma que já está publicado) o comentário da execução. `modo` MANUAL exige `confirmado` (a confirmação nativa
 * acontece no processo principal, nunca na página). AGENDADO exige política vigente que cubra ticket e tipo.
 */
export async function publicarComentarioDeResultado(trabalhoId: string, modo: 'MANUAL' | 'AGENDADO', pub: PublicadorJira, b?: string, confirmado = false, agora = new Date()): Promise<Pub> {
  const t = obterTrabalho(trabalhoId, b); const nome = obterEspaco(t.espacoId, b).nome;
  if (modo === 'MANUAL' && !confirmado) throw new Error('HUMAN_CONFIRMATION_REQUIRED');
  const c = montarComentario(t, nome); const ticket = t.ticket!; const chave = `${t.id}:${ticket}`;
  const sha = createHash('sha256').update(c.texto).digest('hex');
  let r = lerPublicacoesJira(b); let reg = r.itens.find(x => x.chave === chave);
  if (reg?.estado === 'PUBLICADO') return reg; // idempotência: nunca publica duas vezes a mesma execução no mesmo ticket
  if (!reg) { reg = { chave, trabalhoId: t.id, espacoId: t.espacoId, ticket, modo, estado: 'PREPARADO', tentativas: 0, textoSha256: sha, texto: c.texto, consumida: false, criadoEm: agora.toISOString() }; r.itens.push(reg); }
  const salvar = (patch: Partial<Pub>) => { r = lerPublicacoesJira(b); const i = r.itens.findIndex(x => x.chave === chave); const novo = registroPub.parse({ ...(i >= 0 ? r.itens[i] : reg), ...patch }); if (i >= 0) r.itens[i] = novo; else r.itens.push(novo); gravarPublicacoesJira(r, b); reg = novo; return novo; };
  salvar({});
  if (modo === 'AGENDADO' && !reg!.consumida) {
    const p = consumirPublicacao(t.espacoId, ticket, t.tipo, b, agora);
    if (!p) { salvar({ estado: 'BLOQUEADO', erro: 'PUBLISH_POLICY_MISSING', ultimaTentativa: agora.toISOString() }); definirEstadoJiraDoTrabalho(t.id, { estado: 'BLOQUEADO', codigo: 'PUBLISH_POLICY_MISSING' }, b); return reg!; }
    salvar({ consumida: true, politicaId: p.id });
  }
  salvar({ tentativas: reg!.tentativas + 1, ultimaTentativa: agora.toISOString(), modo });
  try {
    // Falha de rede ambígua na tentativa anterior: o comentário pode já existir. Procura o marcador antes de enviar.
    const existente = reg!.tentativas > 1 || reg!.estado === 'FALHA' ? await pub.procurarComentarioJira(t.espacoId, ticket, c.marcador) : null;
    if (existente) { salvar({ estado: 'PUBLICADO', comentarioId: existente, publicadoEm: agora.toISOString(), erro: undefined }); definirEstadoJiraDoTrabalho(t.id, { estado: 'PUBLICADO', comentarioId: existente }, b); return reg!; }
    const enviado = await pub.comentarJira(t.espacoId, ticket, c.adf);
    salvar({ estado: 'PUBLICADO', comentarioId: enviado.id, vinculoId: enviado.vinculoId, conexaoId: enviado.conexaoId, publicadoEm: new Date().toISOString(), erro: undefined });
    definirEstadoJiraDoTrabalho(t.id, { estado: 'PUBLICADO', comentarioId: enviado.id }, b); return reg!;
  } catch (e) {
    const cod = codigoDoErroDePublicacao(e); salvar({ estado: 'FALHA', erro: cod.slice(0, 80) }); definirEstadoJiraDoTrabalho(t.id, { estado: publicacaoPodeRepetir(cod) ? 'PENDENTE' : 'FALHA', codigo: cod.slice(0, 80) }, b); return reg!;
  }
}
