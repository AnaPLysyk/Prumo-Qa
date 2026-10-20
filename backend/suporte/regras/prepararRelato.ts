/** Prepara o relato: valida, revisa a privacidade (segredo bloqueia, dado pessoal avisa) e monta texto e endereço. */

import { montarTextoDoRelato } from './montarTextoDoRelato.js';
import { revisarPrivacidadeDoRelato } from './revisarPrivacidadeDoRelato.js';
import { AVISO_PUBLICO, Contexto, Solicitacao, limiteUrl, modelo, rotulo, solicitacaoSchema, urlBase } from '../tipos/suporte.js';

/** Endereço oficial do formulário do GitHub com os campos do template preenchidos (ids: descricao, esperado, passos, ambiente). */
function montarEnderecoDoRelato(s: Solicitacao, corpo: ReturnType<typeof montarTextoDoRelato>) {
  const q = new URLSearchParams({ template: modelo[s.categoria], title: `[${rotulo[s.categoria]}] ${s.titulo}` });
  let truncado = false;
  for (const [id, valor] of [['descricao', corpo.descricao], ['esperado', corpo.esperado], ['passos', corpo.passos], ['ambiente', corpo.ambiente]] as const) {
    if (!valor) continue; let v: string = valor;
    q.set(id, v);
    while (`${urlBase}?${q}`.length > limiteUrl && v.length > 200) { v = v.slice(0, Math.floor(v.length * 0.8)); q.set(id, v + '…'); truncado = true; }
  }
  return { url: `${urlBase}?${q}`, truncado };
}

export function prepararRelato(entrada: unknown, c: Contexto) {
  const s = solicitacaoSchema.parse(entrada);
  if (s.categoria === 'bug' && !s.passos) return { ok: false as const, bloqueios: [{ tipo: 'passos para reproduzir são obrigatórios em bug', trecho: '' }], avisos: [], aviso: AVISO_PUBLICO };
  const corpo = montarTextoDoRelato(s, c);
  const { bloqueios, avisos } = revisarPrivacidadeDoRelato({ titulo: s.titulo, descricao: s.descricao, esperado: s.esperado, passos: s.passos, diagnostico: s.incluirDiagnostico ? c.diagnostico : undefined });
  if(bloqueios.length)return {ok:false as const,bloqueios,avisos:[],aviso:AVISO_PUBLICO};
  const { url, truncado } = montarEnderecoDoRelato(s, corpo);
  return { ok:true as const, bloqueios, avisos, aviso: AVISO_PUBLICO, idLocal:corpo.idLocal, titulo: `[${rotulo[s.categoria]}] ${s.titulo}`, markdown: corpo.markdown, url, truncado, publico: true, campos: { descricao: corpo.descricao, esperado: corpo.esperado, passos: corpo.passos, ambiente: corpo.ambiente } };
}
