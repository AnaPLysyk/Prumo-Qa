/** Prepara o relato: valida, revisa a privacidade (segredo bloqueia, dado pessoal avisa) e monta texto e endereço. */
import { montarEnderecoDoRelato } from './montarEnderecoDoRelato.js';
import { montarTextoDoRelato } from './montarTextoDoRelato.js';
import { revisarPrivacidadeDoRelato } from './revisarPrivacidadeDoRelato.js';
import { AVISO_PUBLICO, Contexto, rotulo, solicitacaoSchema } from '../tipos/suporte.js';

export function prepararRelato(entrada: unknown, c: Contexto) {
  const s = solicitacaoSchema.parse(entrada);
  if (s.categoria === 'bug' && !s.passos) return { ok: false as const, bloqueios: [{ tipo: 'passos para reproduzir são obrigatórios em bug', trecho: '' }], avisos: [], aviso: AVISO_PUBLICO };
  const corpo = montarTextoDoRelato(s, c);
  const { bloqueios, avisos } = revisarPrivacidadeDoRelato({ titulo: s.titulo, descricao: s.descricao, esperado: s.esperado, passos: s.passos, diagnostico: s.incluirDiagnostico ? c.diagnostico : undefined });
  if(bloqueios.length)return {ok:false as const,bloqueios,avisos:[],aviso:AVISO_PUBLICO};
  const { url, truncado } = montarEnderecoDoRelato(s, corpo);
  return { ok:true as const, bloqueios, avisos, aviso: AVISO_PUBLICO, idLocal:corpo.idLocal, titulo: `[${rotulo[s.categoria]}] ${s.titulo}`, markdown: corpo.markdown, url, truncado, publico: true, campos: { descricao: corpo.descricao, esperado: corpo.esperado, passos: corpo.passos, ambiente: corpo.ambiente } };
}
