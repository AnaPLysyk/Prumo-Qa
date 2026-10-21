/**
 * Rota dos códigos por e-mail: recebe do aplicativo um código de 6 dígitos e o manda ao e-mail informado, pelo Resend.
 * Não guarda e-mails nem códigos: só contadores em memória para limitar abuso. Nos registros, o e-mail aparece mascarado e o código nunca.
 */
import { EMAIL, lerCorpo, lerObjeto, ipDe, mascarar, responder } from '../../compartilhado/servidor/comum.mjs';
import { montarEmail } from './modeloDeEmail.mjs';

export const FINALIDADES = ['CADASTRO', 'SENHA', 'ENTRADA'];
export const IDIOMAS = ['pt-BR', 'en'];
/** Limites por janela de tempo. O total por hora protege a cota do provedor. */
export const LIMITES = { porEmail10min: 3, porEmailDia: 10, porIpHora: 30, totalHora: 300 };

/** Textos de cada finalidade: chip do cartão, título e para que serve o código. */
const TEXTOS = {
  'pt-BR': {
    CADASTRO: ['Confirmação de e-mail', 'Confirme seu e-mail', 'confirmar seu e-mail e concluir o cadastro no Prumo QA'],
    SENHA: ['Recuperar acesso', 'Defina uma senha nova', 'definir uma senha nova no Prumo QA'],
    ENTRADA: ['Duas etapas', 'Conclua a entrada', 'concluir a entrada no Prumo QA']
  },
  en: {
    CADASTRO: ['E-mail confirmation', 'Confirm your e-mail', 'confirm your e-mail and finish signing up to Prumo QA'],
    SENHA: ['Account recovery', 'Set a new password', 'set a new password in Prumo QA'],
    ENTRADA: ['Two-step sign-in', 'Finish signing in', 'finish signing in to Prumo QA']
  }
};

/** E-mail com a aparência do Prumo: o único dado variável é o código, conferido como 6 dígitos antes de chegar aqui. */
export function mensagem({ codigo, finalidade, idioma }) {
  const en = idioma === 'en';
  const [chip, titulo, acao] = TEXTOS[en ? 'en' : 'pt-BR'][finalidade];
  const assunto = en ? `Your Prumo QA code: ${codigo}` : `Seu código do Prumo QA: ${codigo}`;
  const observacao = en
    ? 'It is valid for 10 minutes and can be used once. ' + (finalidade === 'ENTRADA' ? 'If it was not you, change your password: someone knows it. Without the code they cannot get in.' : 'If you did not request it, ignore this message: nothing changes without the code.')
    : 'Ele vale por 10 minutos e só pode ser usado uma vez. ' + (finalidade === 'ENTRADA' ? 'Se não foi você, troque sua senha: alguém sabe ela. Sem o código, ninguém entra.' : 'Se você não pediu, ignore esta mensagem: nada muda sem o código.');
  const texto = en ? `Use the code below to ${acao}.` : `Use o código abaixo para ${acao}.`;
  return { assunto, ...montarEmail({ idioma: en ? 'en' : 'pt-BR', chip, titulo, texto, codigo, observacao }) };
}

/** Confere o pedido do aplicativo: só as chaves conhecidas, e-mail válido, código de 6 dígitos e finalidade da lista. */
export function lerPedido(d) {
  if (!d || Object.keys(d).some((k) => !['email', 'codigo', 'finalidade', 'idioma'].includes(k))) return null;
  const email = typeof d.email === 'string' ? d.email.trim().toLowerCase() : '';
  if (email.length > 254 || !EMAIL.test(email)) return null;
  if (typeof d.codigo !== 'string' || !/^\d{6}$/.test(d.codigo)) return null;
  if (!FINALIDADES.includes(d.finalidade)) return null;
  if (d.idioma !== undefined && !IDIOMAS.includes(d.idioma)) return null;
  return { email, codigo: d.codigo, finalidade: d.finalidade, idioma: d.idioma ?? 'pt-BR' };
}

/** Envio real pelo Resend (https://resend.com): o remetente precisa ser de um domínio verificado lá. */
export function enviarPeloResend({ chave, remetente, buscar = fetch }) {
  return async ({ para, assunto, texto, html }) => {
    const r = await buscar('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: 'Bearer ' + chave, 'Content-Type': 'application/json' }, body: JSON.stringify({ from: remetente, to: [para], subject: assunto, text: texto, html }), signal: AbortSignal.timeout(15_000) });
    if (!r.ok) throw new Error('o Resend respondeu ' + r.status);
  };
}

/** POST /v1/codigos. `enviar` é injetado: os testes usam uma caixa em memória e nunca falam com o Resend. */
export function rotaDeCodigos({ enviar, configurado, limites = LIMITES, limitador, registrar }) {
  return async (req, res) => {
    if (req.method !== 'POST') return responder(res, 405, { erro: 'METHOD_NOT_ALLOWED' }, { Allow: 'POST' });
    if (!String(req.headers['content-type'] || '').startsWith('application/json')) return responder(res, 415, { erro: 'BODY_INVALID' });
    const corpo = await lerCorpo(req, 2048); if (!corpo) return responder(res, 413, { erro: 'BODY_INVALID' });
    const pedido = lerPedido(lerObjeto(corpo)); if (!pedido) return responder(res, 400, { erro: 'EMAIL_INVALID' });
    if (!configurado) { registrar('envio recusado: serviço sem RESEND_API_KEY ou PRUMO_EMAIL_REMETENTE'); return responder(res, 503, { erro: 'EMAIL_SERVICE_NOT_CONFIGURED' }); }
    const ip = ipDe(req);
    const janelas = [['email10:' + pedido.email, 10 * 60_000, limites.porEmail10min], ['emailDia:' + pedido.email, 24 * 3_600_000, limites.porEmailDia], ['codigos-ip:' + ip, 3_600_000, limites.porIpHora], ['codigos-total', 3_600_000, limites.totalHora]];
    if (limitador.excede(janelas)) { registrar('limite atingido para ' + mascarar(pedido.email)); return responder(res, 429, { erro: 'EMAIL_RATE_LIMIT' }, { 'Retry-After': '600' }); }
    // Conta antes de enviar: falha do provedor também consome a cota, para ninguém martelar o serviço.
    limitador.marcar(janelas);
    try { await enviar({ para: pedido.email, ...mensagem(pedido) }); }
    catch (e) { registrar('falha ao enviar para ' + mascarar(pedido.email) + ': ' + String(e?.message || e).slice(0, 200)); return responder(res, 502, { erro: 'EMAIL_SEND_FAILED' }); }
    registrar('código de ' + pedido.finalidade + ' enviado para ' + mascarar(pedido.email));
    responder(res, 202, { enviado: true });
  };
}
