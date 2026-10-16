import http from 'node:http';
import { criarServico } from '../../servico-de-email/servidor.mjs';

/**
 * Caixa de e-mail dos testes: o serviço de envio real (servico-de-email/servidor.mjs) em 127.0.0.1, com o Resend trocado por uma
 * lista em memória. O aplicativo aponta para ela com PRUMO_SERVICO_DE_EMAIL. Não é um teste e nunca fala com a internet.
 */
let caixa = null;
export async function caixaDeEmail() {
  if (caixa) return caixa;
  const mensagens = [];
  const limites = { porEmail10min: 1e6, porEmailDia: 1e6, porIpHora: 1e6, totalHora: 1e6 };
  const servidor = http.createServer(criarServico({ enviar: async (m) => { mensagens.push(m); }, limites, registrar: () => {} }));
  await new Promise((ok) => servidor.listen(0, '127.0.0.1', ok)); servidor.unref();
  const url = 'http://127.0.0.1:' + servidor.address().port;
  /** Último código mandado a este e-mail, lido do texto da mensagem como a pessoa leria. */
  const ultimoCodigo = (email) => {
    const m = mensagens.filter((x) => x.para === email.toLowerCase()).at(-1);
    if (!m) throw new Error('Nenhum e-mail para ' + email);
    return /\b(\d{6})\b/.exec(m.texto)[1];
  };
  caixa = { url, mensagens, ultimoCodigo };
  return caixa;
}
