/** Endereço do serviço do Prumo (servico-do-prumo/ no Render), que manda os códigos por e-mail e recebe os chamados de suporte, e a chamada HTTP até ele. */

export const ENDERECO_DO_SERVICO = 'https://prumo-qa-servico.onrender.com';

/** PRUMO_SERVICO troca o endereço; fora de HTTPS, só 127.0.0.1 (testes). O caminho é sempre montado pelo código do Prumo, nunca pela janela. */
export function urlDoServico(caminho: string, codigoDeFalha: string): URL {
  let u: URL; try { u = new URL(process.env.PRUMO_SERVICO || ENDERECO_DO_SERVICO); } catch { throw new Error(codigoDeFalha + ': endereço do serviço do Prumo inválido.'); }
  if (!(u.protocol === 'https:' || (u.protocol === 'http:' && u.hostname === '127.0.0.1'))) throw new Error(codigoDeFalha + ': endereço do serviço do Prumo recusado.');
  return new URL(caminho, u);
}

/** No plano gratuito o serviço adormece; acordar leva até um minuto, por isso a espera é longa. Sem rede, a falha vem com o código dado. */
export async function chamarServico(caminho: string, op: { metodo: 'GET' | 'POST' | 'PUT' | 'PATCH'; cabecalhos?: Record<string, string>; corpo?: string | Uint8Array; segundos?: number }, codigoDeFalha: string): Promise<Response> {
  const destino = urlDoServico(caminho, codigoDeFalha);
  try {
    const corpo = typeof op.corpo === 'string' || op.corpo === undefined ? op.corpo : new Blob([new Uint8Array(op.corpo)]);
    return await fetch(destino, { method: op.metodo, headers: { 'User-Agent': 'Prumo-QA', ...(op.cabecalhos ?? {}) }, body: corpo, redirect: 'error', signal: AbortSignal.timeout((op.segundos ?? 75) * 1000) });
  } catch { throw new Error(codigoDeFalha + ': não foi possível falar com o serviço do Prumo; confira a internet e tente de novo.'); }
}
