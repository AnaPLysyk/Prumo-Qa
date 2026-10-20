/** Uma chamada HTTPS dos logins por provedor: host numa lista fechada, tempo limite e resposta limitada a 1 MB. */
import https from 'node:https';

type HostDoLogin = 'github.com' | 'api.github.com' | 'oauth2.googleapis.com' | 'openidconnect.googleapis.com';
type RespostaHttps = { status: number; json: unknown };

/** O host é sempre um dos da lista, escolhido pelo código do Prumo, nunca pela janela; `codigo` prefixa o erro (ex.: GITHUB_LOGIN_FAILED). */
export function chamarHttps(codigo: string, host: HostDoLogin, caminho: string, metodo: 'GET' | 'POST', cabecalhos: Record<string, string>, corpo?: string): Promise<RespostaHttps> {
  return new Promise((ok, falha) => {
    const req = https.request({ host, path: caminho, method: metodo, headers: { Accept: 'application/json', 'User-Agent': 'Prumo-QA', ...cabecalhos }, timeout: 15_000 }, (res) => {
      let texto = ''; res.setEncoding('utf8');
      res.on('data', (p: string) => { texto += p; if (texto.length > 1_000_000) { req.destroy(); falha(new Error(codigo + ': resposta grande demais.')); } });
      res.on('end', () => { try { ok({ status: res.statusCode ?? 0, json: JSON.parse(texto) }); } catch { falha(new Error(codigo + ': resposta inválida.')); } });
    });
    req.on('timeout', () => req.destroy(new Error(codigo + ': o provedor demorou demais.')));
    req.on('error', (e) => falha(e.message.startsWith(codigo) ? e : new Error(codigo + ': não foi possível falar com o provedor.')));
    if (corpo) req.write(corpo);
    req.end();
  });
}
