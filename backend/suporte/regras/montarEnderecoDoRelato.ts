/** Monta o endereço do formulário do GitHub Issues já preenchido, encurtando o texto se não couber. */
import { montarTextoDoRelato } from './montarTextoDoRelato.js';
import { Solicitacao, limiteUrl, modelo, rotulo, urlBase } from '../tipos/suporte.js';

/** Endereço oficial do formulário do GitHub com os campos do template preenchidos (ids: descricao, esperado, passos, ambiente). */
export function montarEnderecoDoRelato(s: Solicitacao, corpo: ReturnType<typeof montarTextoDoRelato>) {
  const q = new URLSearchParams({ template: modelo[s.categoria], title: `[${rotulo[s.categoria]}] ${s.titulo}` });
  let truncado = false;
  for (const [id, valor] of [['descricao', corpo.descricao], ['esperado', corpo.esperado], ['passos', corpo.passos], ['ambiente', corpo.ambiente]] as const) {
    if (!valor) continue; let v: string = valor;
    q.set(id, v);
    while (`${urlBase}?${q}`.length > limiteUrl && v.length > 200) { v = v.slice(0, Math.floor(v.length * 0.8)); q.set(id, v + '…'); truncado = true; }
  }
  return { url: `${urlBase}?${q}`, truncado };
}
