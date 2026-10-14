/** Cria a verificação que o worker usa: só executa se houver autorização vigente para exatamente o mesmo escopo, e gasta um uso. */
import { estadoDaAutorizacao } from './estadoDaAutorizacao.js';
import { gravarAutorizacoes } from '../banco/gravarAutorizacoes.js';
import { lerAutorizacoes } from '../banco/lerAutorizacoes.js';
import { Delegada } from '../../testes/tipos/execucao.js';

/** Delegada para o executor. Consome um uso de forma atômica ao reconhecer o escopo; qualquer divergência devolve null (BLOCKED). */
export function autorizacaoDelegada(espacoId: string, ambiente: string, base?: string, agora = () => new Date()): Delegada {
  return async ({ scopeHash, capability }) => {
    const r = lerAutorizacoes(base); const t = agora();
    const a = r.execucoes.find(x => x.espacoId === espacoId && x.capability === capability && x.ambiente === ambiente && x.scopeHash === scopeHash && estadoDaAutorizacao(x, t) === 'VIGENTE');
    if (!a) return null; a.usos += 1; gravarAutorizacoes(r, base);
    return { subject: a.aprovadoPor, method: 'delegada:' + a.metodo, scopeHash, at: t.toISOString() };
  };
}
