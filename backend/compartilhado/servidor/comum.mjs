/** Peças comuns do serviço do Prumo: resposta JSON, leitura do corpo com limite, IP de quem pediu, máscara de e-mail e limites por janela de tempo. */

export const mascarar = (email) => { const [u, d] = String(email).split('@'); return (u || '').slice(0, 1) + '***@' + (d || ''); };

export function responder(res, status, corpo, extra = {}) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...extra });
  res.end(JSON.stringify(corpo));
}

/**
 * IP de quem pediu. No Render o cliente chega por proxy: vale o CF-Connecting-IP (o Cloudflare sobrescreve o que o cliente mandar) ou o
 * ÚLTIMO item do X-Forwarded-For, que é o que o proxy acrescentou; os primeiros itens quem pede pode inventar. Sem proxy, o endereço da conexão.
 */
export function ipDe(req) {
  const proxy = req.headers['cf-connecting-ip'] || String(req.headers['x-forwarded-for'] || '').split(',').map((x) => x.trim()).filter(Boolean).at(-1);
  return String(proxy || req.socket.remoteAddress || 'desconhecido').slice(0, 64);
}

/** Lê o corpo até `limite` bytes. Acima disso o resto é lido e descartado e a resposta é null (a rota responde 413, sem derrubar a conexão). */
export function lerCorpo(req, limite) {
  return new Promise((ok, falha) => {
    const partes = []; let tamanho = 0; let grande = false;
    req.on('data', (p) => { if (grande) return; tamanho += p.length; if (tamanho > limite) { grande = true; partes.length = 0; return; } partes.push(p); });
    req.on('end', () => ok(grande ? null : Buffer.concat(partes)));
    req.on('error', falha);
  });
}

/** JSON de um objeto simples (sem lista nem valor solto); qualquer outra coisa vira null. */
export function lerObjeto(buffer) {
  try { const d = JSON.parse(buffer.toString('utf8')); return d && typeof d === 'object' && !Array.isArray(d) ? d : null; } catch { return null; }
}

/** Contadores por janela de tempo, só na memória (reiniciar o serviço zera). Cada janela é [chave, milissegundos, máximo]. */
export function criarLimitador(agora = () => Date.now()) {
  const marcas = new Map();
  const contagem = (chave, janela, t) => { const l = (marcas.get(chave) || []).filter((x) => t - x < janela); if (l.length) marcas.set(chave, l); else marcas.delete(chave); return l.length; };
  return {
    excede: (janelas) => { const t = agora(); return janelas.some(([c, j, max]) => contagem(c, j, t) >= max); },
    marcar: (janelas) => {
      const t = agora(); for (const [c] of janelas) marcas.set(c, [...(marcas.get(c) || []), t]);
      // Muitas chaves diferentes (e-mails, IPs): de tempos em tempos joga fora as que já saíram de todas as janelas (até 1 dia).
      if (marcas.size > 20_000) for (const [c, l] of marcas) if (!l.some((x) => t - x < 24 * 3_600_000)) marcas.delete(c);
    }
  };
}

/** Texto do pedido: sem caracteres de controle (exceto quebra de linha e tabulação), aparado e dentro do tamanho. */
export function textoLimpo(valor, minimo, maximo) {
  if (typeof valor !== 'string') return null;
  const t = valor.replace(/\r\n?/g, '\n').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f‪-‮⁦-⁩]/g, '').trim();
  return t.length >= minimo && t.length <= maximo ? t : null;
}

export const EMAIL = /^[^\s@<>()",;:\\[\]]{1,64}@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/;
