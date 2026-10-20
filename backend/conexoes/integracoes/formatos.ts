/** Formata, valida e normaliza dados recebidos de integrações externas. */
import { codificarParaUrl } from "../../compartilhado/texto.js";
import { ErroServico } from "./ErroServico.js";
import { Recurso, identidadeRecurso } from "../../projetos/contratos.js";
import { ConfigServico, nome, obj, sid } from "../tipos/adaptador.js";
import { mascarar } from "../../compartilhado/seguranca/mascarar.js";

export function idNumericoDaConsulta(id?: string) {
  if (!id || !/^\d{1,15}$/.test(id)) throw new ErroServico('SERVICE_RESPONSE_INVALID');
  return codificarParaUrl(id);
}

/** Monta os parâmetros de consulta de uma URL, ignorando os vazios. */

export const parametrosDaUrl=(p:Record<string,string|number|undefined>)=>new URLSearchParams(Object.entries(p).filter(([,v])=>v!==undefined).map(([k,v])=>[k,String(v)])).toString();

/** Coloca um texto entre aspas para uma busca JQL, escapando caracteres. */

export const textoEntreAspasJql = (s: string) => '"' + s.replace(/[\\"]/g, '\\$&').replace(/[\x00-\x1f]/g, ' ') + '"';

export function recursoDaResposta(c: ConfigServico, v: unknown): Recurso {
  const o = obj.parse(v); const s = c.servico;
  const id = sid.parse(s === 'qase' ? o.code : o.id); const chave = nome.parse(s === 'github' ? o.full_name : s === 'jira' ? o.key : o.code);
  if (id === c.token || chave.includes(c.token) || !(s === 'qase' ? /^[A-Z][A-Z0-9]{1,9}$/.test(id) : /^\d{1,20}$/.test(id)) || !(s === 'github' ? /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(chave) : /^[A-Z][A-Z0-9_]*$/.test(chave))) throw new ErroServico('SERVICE_RESPONSE_INVALID');
  return identidadeRecurso.parse({ id, chave, nome: limparRespostaDoServico(c, nome.parse(s === 'github' ? o.name : s === 'jira' ? o.name : o.title)), instancia: c.instancia, contaId: c.contaId, tipoId: s === 'qase' ? 'codigo_api' : 'id_api' });
}

export function saidaDaConsulta(c: ConfigServico, dados: unknown, proxima: string | number | null | undefined, r: Recurso, endpoint: string) {
  return {
    dados: Array.isArray(dados) && endpoint === '/rest/api/3/field' ? dados.map(x => limparRespostaDoServico(c, x)) : limparRespostaDoServico(c, dados),
    proxima: proxima ?? null, servico: c.servico, origem: c.instancia, recursoId: r.id, consultadoEm: new Date().toISOString(), cache: false, endpoint: endpoint.split('?')[0], metodo: 'GET',
    limitesExibicao: 'Detalhes: textos até 20000 caracteres, listas internas até 100 itens e objetos até 80 campos; chaves sensíveis removidas. A resposta integral não é armazenada.',
    interpretacao: 'Informação externa consultada; não é requisito aprovado nem cobertura verificada.'
  };
}

/** Extrai o texto puro de um campo vindo do Jira/Qase/GitHub (inclusive do formato ADF), com limite, sem interpretar HTML. */

export function textoRemoto(v:unknown,limite=20000):string {
  if(v===null||v===undefined)return '';if(typeof v==='string')return v.slice(0,limite);
  if(typeof v!=='object')return String(v).slice(0,limite);
  // ADF é conteúdo, não HTML nem instrução. Apenas nós textuais conhecidos.
  const o=v as Record<string,unknown>;if(o.type==='text'&&typeof o.text==='string')return o.text.slice(0,limite);
  if(Array.isArray(o.content))return o.content.map(x=>textoRemoto(x,limite)).join(o.type==='doc'?'\n':' ').slice(0,limite);
  return JSON.stringify(v).slice(0,limite);
}

export function limparRespostaDoServico(c: ConfigServico, v: unknown): unknown {
  if (typeof v === 'string') return mascarar(v.slice(0, 20000), [c.token, Buffer.from((c.usuario ?? '') + ':' + c.token).toString('base64')]);
  if (Array.isArray(v)) return v.slice(0, 100).map(x => limparRespostaDoServico(c, x));
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).filter(([k]) => !/(token|password|secret|authorization)/i.test(k)).slice(0, 80).map(([k, x]) => [k, limparRespostaDoServico(c, x)]));
  return v;
}
