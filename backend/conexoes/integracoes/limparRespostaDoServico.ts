/** Limpa uma resposta do serviço antes de mostrar: mascara a credencial, tira campos de senha/token e limita textos, listas e objetos. */
import { mascarar } from '../../compartilhado/seguranca/mascarar.js';
import { ConfigServico } from '../tipos/adaptador.js';

export function limparRespostaDoServico(c: ConfigServico, v: unknown): unknown {
  if (typeof v === 'string') return mascarar(v.slice(0, 20000), [c.token, Buffer.from((c.usuario ?? '') + ':' + c.token).toString('base64')]);
  if (Array.isArray(v)) return v.slice(0, 100).map(x => limparRespostaDoServico(c, x));
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).filter(([k]) => !/(token|password|secret|authorization)/i.test(k)).slice(0, 80).map(([k, x]) => [k, limparRespostaDoServico(c, x)]));
  return v;
}
