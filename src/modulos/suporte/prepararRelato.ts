/** Prepara o relato para revisão, bloqueando segredos e sem enviar nada automaticamente. */
import { solicitacaoSchema, AVISO_PUBLICO, rotulo, type Contexto } from './definirSolicitacao.js';
import { montarCorpo } from './montarTextoRelato.js';
import { revisarPrivacidade } from './revisarPrivacidadeRelato.js';
import { montarUrl } from './gerarLinkGithubRelato.js';

export function prepararSolicitacao(entrada: unknown, c: Contexto) {
  const s = solicitacaoSchema.parse(entrada);
  if (s.categoria === 'bug' && !s.passos) return { ok: false as const, bloqueios: [{ tipo: 'passos para reproduzir são obrigatórios em bug', trecho: '' }], avisos: [], aviso: AVISO_PUBLICO };
  const corpo = montarCorpo(s, c);
  const { bloqueios, avisos } = revisarPrivacidade({ titulo: s.titulo, descricao: s.descricao, esperado: s.esperado, passos: s.passos, diagnostico: s.incluirDiagnostico ? c.diagnostico : undefined });
  if(bloqueios.length)return {ok:false as const,bloqueios,avisos:[],aviso:AVISO_PUBLICO};
  const { url, truncado } = montarUrl(s, corpo);
  return { ok:true as const, bloqueios, avisos, aviso: AVISO_PUBLICO, idLocal:corpo.idLocal, titulo: `[${rotulo[s.categoria]}] ${s.titulo}`, markdown: corpo.markdown, url, truncado, publico: true, campos: { descricao: corpo.descricao, esperado: corpo.esperado, passos: corpo.passos, ambiente: corpo.ambiente } };
}
