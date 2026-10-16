/** Pede ao serviço do Prumo que mande o código de 6 dígitos ao e-mail da pessoa; só o e-mail, o código, a finalidade e o idioma saem do computador. */
import { chamarServico } from '../../compartilhado/integracoes/servicoDoPrumo.js';

export type PedidoDeCodigo = { email: string; codigo: string; finalidade: 'CADASTRO' | 'SENHA' | 'ENTRADA'; idioma: 'pt-BR' | 'en' };

export async function enviarCodigoPorEmail(p: PedidoDeCodigo): Promise<void> {
  const r = await chamarServico('/v1/codigos', { metodo: 'POST', cabecalhos: { 'Content-Type': 'application/json' }, corpo: JSON.stringify(p) }, 'EMAIL_SERVICE_UNAVAILABLE');
  if (r.status === 202) return;
  if (r.status === 429) throw new Error('EMAIL_RATE_LIMIT: muitos códigos pedidos para este e-mail; espere alguns minutos.');
  if (r.status === 400) throw new Error('EMAIL_INVALID: o serviço de envio recusou este e-mail; confira o endereço.');
  throw new Error('EMAIL_SEND_FAILED: o serviço de envio não conseguiu mandar o e-mail agora; tente de novo em instantes.');
}
