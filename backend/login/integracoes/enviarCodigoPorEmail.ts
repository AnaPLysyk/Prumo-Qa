/** Pede ao serviço de envio do Prumo que mande o código de 6 dígitos ao e-mail da pessoa; só o e-mail, o código, a finalidade e o idioma saem do computador. */

/** Endereço do serviço (servico-de-email/ no Render). PRUMO_SERVICO_DE_EMAIL troca o endereço; fora de HTTPS, só 127.0.0.1 (testes). */
export const ENDERECO_DO_SERVICO = 'https://prumo-qa-email.onrender.com';

export type PedidoDeCodigo = { email: string; codigo: string; finalidade: 'CADASTRO' | 'SENHA'; idioma: 'pt-BR' | 'en' };

function enderecoDoServico(): URL {
  let u: URL; try { u = new URL(process.env.PRUMO_SERVICO_DE_EMAIL || ENDERECO_DO_SERVICO); } catch { throw new Error('EMAIL_SERVICE_UNAVAILABLE: endereço do serviço de envio inválido.'); }
  if (!(u.protocol === 'https:' || (u.protocol === 'http:' && u.hostname === '127.0.0.1'))) throw new Error('EMAIL_SERVICE_UNAVAILABLE: endereço do serviço de envio recusado.');
  return new URL('/v1/codigos', u);
}

/** No plano gratuito o serviço adormece; acordar leva até um minuto, por isso a espera é longa. */
export async function enviarCodigoPorEmail(p: PedidoDeCodigo): Promise<void> {
  const destino = enderecoDoServico(); let r: Response;
  try { r = await fetch(destino, { method: 'POST', headers: { 'Content-Type': 'application/json', 'User-Agent': 'Prumo-QA' }, body: JSON.stringify(p), redirect: 'error', signal: AbortSignal.timeout(75_000) }); }
  catch { throw new Error('EMAIL_SERVICE_UNAVAILABLE: não foi possível falar com o serviço de envio; confira a internet e tente de novo.'); }
  if (r.status === 202) return;
  if (r.status === 429) throw new Error('EMAIL_RATE_LIMIT: muitos códigos pedidos para este e-mail; espere alguns minutos.');
  if (r.status === 400) throw new Error('EMAIL_INVALID: o serviço de envio recusou este e-mail; confira o endereço.');
  throw new Error('EMAIL_SEND_FAILED: o serviço de envio não conseguiu mandar o e-mail agora; tente de novo em instantes.');
}
