/**
 * Serviço de envio do Prumo QA: recebe do aplicativo um código de 6 dígitos e o manda ao e-mail informado, pelo Resend.
 * Sem dependências. A chave do Resend fica só aqui (variável de ambiente), nunca no aplicativo distribuído.
 * Não guarda e-mails nem códigos: só contadores em memória para limitar abuso. Nos registros, o e-mail aparece mascarado e o código nunca.
 */
import http from 'node:http';
import { pathToFileURL } from 'node:url';

export const FINALIDADES = ['CADASTRO', 'SENHA'];
export const IDIOMAS = ['pt-BR', 'en'];
/** Limites por janela de tempo. O total por hora protege a cota do provedor; reiniciar o serviço zera os contadores. */
export const LIMITES = { porEmail10min: 3, porEmailDia: 10, porIpHora: 30, totalHora: 300 };
const TAMANHO_MAXIMO = 2048;
const EMAIL = /^[^\s@<>()",;:\\[\]]{1,64}@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/;

export const mascarar = (email) => { const [u, d] = email.split('@'); return u.slice(0, 1) + '***@' + d; };

/** Texto fixo do e-mail: o único dado variável é o código, conferido como 6 dígitos antes de chegar aqui. */
export function mensagem({ codigo, finalidade, idioma }) {
  const en = idioma === 'en';
  const acao = finalidade === 'SENHA'
    ? (en ? 'set a new password in Prumo QA' : 'definir uma senha nova no Prumo QA')
    : (en ? 'confirm your e-mail and finish signing up to Prumo QA' : 'confirmar seu e-mail e concluir o cadastro no Prumo QA');
  const assunto = en ? `Your Prumo QA code: ${codigo}` : `Seu código do Prumo QA: ${codigo}`;
  const linhas = en
    ? [`Use the code ${codigo} to ${acao}.`, 'It is valid for 10 minutes and can be used once.', 'If you did not request it, ignore this message: nothing changes without the code.']
    : [`Use o código ${codigo} para ${acao}.`, 'Ele vale por 10 minutos e só pode ser usado uma vez.', 'Se você não pediu, ignore esta mensagem: nada muda sem o código.'];
  const html = `<div style="font-family:system-ui,sans-serif;font-size:15px;line-height:1.5;color:#111"><p>${linhas[0].replace(codigo, `<strong style="font-size:22px;letter-spacing:.12em">${codigo}</strong>`)}</p><p>${linhas[1]}</p><p style="color:#555">${linhas[2]}</p><p style="color:#555">Prumo QA</p></div>`;
  return { assunto, texto: linhas.join('\n\n') + '\n\nPrumo QA', html };
}

/** Confere o pedido do aplicativo: só as chaves conhecidas, e-mail válido, código de 6 dígitos e finalidade da lista. */
export function lerPedido(corpo) {
  let d; try { d = JSON.parse(corpo); } catch { return null; }
  if (!d || typeof d !== 'object' || Array.isArray(d)) return null;
  if (Object.keys(d).some((k) => !['email', 'codigo', 'finalidade', 'idioma'].includes(k))) return null;
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

/** IP de quem pediu: no Render o cliente chega por proxy; sem cabeçalho de proxy, vale o endereço da conexão. */
function ipDe(req) {
  const proxy = req.headers['cf-connecting-ip'] || String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return String(proxy || req.socket.remoteAddress || 'desconhecido').slice(0, 64);
}

/** Cria o atendimento HTTP. `enviar` é injetado: os testes usam uma caixa em memória e nunca falam com o Resend. */
export function criarServico({ enviar, configurado = true, limites = LIMITES, agora = () => Date.now(), registrar = (linha) => console.log(linha) }) {
  const marcas = new Map();
  const contagem = (chave, janela, t) => { const l = (marcas.get(chave) || []).filter((x) => t - x < janela); if (l.length) marcas.set(chave, l); else marcas.delete(chave); return l.length; };
  const marcar = (chaves, t) => { for (const c of chaves) marcas.set(c, [...(marcas.get(c) || []), t]); };
  const responder = (res, status, corpo, extra = {}) => { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...extra }); res.end(JSON.stringify(corpo)); };

  return function atender(req, res) {
    const caminho = (req.url || '').split('?')[0];
    if (req.method === 'GET' && caminho === '/saude') return responder(res, 200, { ok: true, configurado });
    if (caminho !== '/v1/codigos') return responder(res, 404, { erro: 'NOT_FOUND' });
    if (req.method !== 'POST') return responder(res, 405, { erro: 'METHOD_NOT_ALLOWED' }, { Allow: 'POST' });
    if (!String(req.headers['content-type'] || '').startsWith('application/json')) return responder(res, 415, { erro: 'BODY_INVALID' });
    let corpo = ''; let grande = false;
    req.setEncoding('utf8');
    // Corpo grande demais: o resto é lido e descartado, e a resposta sai no fim (derrubar a conexão esconderia o 413).
    req.on('data', (p) => { if (grande) return; corpo += p; if (corpo.length > TAMANHO_MAXIMO) { grande = true; corpo = ''; } });
    req.on('end', async () => {
      if (grande) return responder(res, 413, { erro: 'BODY_INVALID' });
      const pedido = lerPedido(corpo); if (!pedido) return responder(res, 400, { erro: 'EMAIL_INVALID' });
      if (!configurado) { registrar('envio recusado: serviço sem RESEND_API_KEY ou PRUMO_EMAIL_REMETENTE'); return responder(res, 503, { erro: 'EMAIL_SERVICE_NOT_CONFIGURED' }); }
      const t = agora(); const ip = ipDe(req);
      const janelas = [['email10:' + pedido.email, 10 * 60_000, limites.porEmail10min], ['emailDia:' + pedido.email, 24 * 3_600_000, limites.porEmailDia], ['ip:' + ip, 3_600_000, limites.porIpHora], ['total', 3_600_000, limites.totalHora]];
      if (janelas.some(([c, j, max]) => contagem(c, j, t) >= max)) { registrar('limite atingido para ' + mascarar(pedido.email)); return responder(res, 429, { erro: 'EMAIL_RATE_LIMIT' }, { 'Retry-After': '600' }); }
      // Conta antes de enviar: falha do provedor também consome a cota, para ninguém martelar o serviço.
      marcar(janelas.map(([c]) => c), t);
      try { await enviar({ para: pedido.email, ...mensagem(pedido) }); }
      catch (e) { registrar('falha ao enviar para ' + mascarar(pedido.email) + ': ' + String(e?.message || e).slice(0, 200)); return responder(res, 502, { erro: 'EMAIL_SEND_FAILED' }); }
      registrar('código de ' + pedido.finalidade + ' enviado para ' + mascarar(pedido.email));
      responder(res, 202, { enviado: true });
    });
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const chave = process.env.RESEND_API_KEY; const remetente = process.env.PRUMO_EMAIL_REMETENTE; const configurado = !!(chave && remetente);
  const enviar = configurado ? enviarPeloResend({ chave, remetente }) : async () => { throw new Error('sem configuração'); };
  const porta = Number(process.env.PORT) || 10000;
  http.createServer(criarServico({ enviar, configurado })).listen(porta, () => console.log('serviço de envio do Prumo QA na porta ' + porta + (configurado ? '' : ' (SEM RESEND_API_KEY/PRUMO_EMAIL_REMETENTE: recusa envios)')));
}
