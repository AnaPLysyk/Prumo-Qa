/** Baixa a imagem de perfil de um link https escolhido pela pessoa: sem redirecionar, sem rede interna, só imagem e com limite de tamanho. */
import dns from 'node:dns/promises';
import net from 'node:net';

const LIMITE = 2 * 1024 * 1024;
const TIPOS = new Set(['image/png', 'image/jpeg', 'image/gif', 'image/webp']);

function enderecoInterno(ip: string): boolean {
  if (net.isIPv6(ip)) { const p = ip.toLowerCase(); return p === '::1' || p.startsWith('fc') || p.startsWith('fd') || p.startsWith('fe80') || p.startsWith('::ffff:') && enderecoInterno(p.slice(7)); }
  const [a = 0, b = 0] = ip.split('.').map(Number);
  return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127);
}

export async function baixarImagemDoLink(link: string): Promise<{ mime: string; base64: string }> {
  let url: URL;
  try { url = new URL(link); } catch { throw new Error('IMAGE_URL_INVALID: use um link completo começando com https://.'); }
  if (url.protocol !== 'https:' || url.username || url.password) throw new Error('IMAGE_URL_INVALID: use um link https sem usuário e senha.');
  const enderecos = await dns.lookup(url.hostname, { all: true }).catch(() => []);
  if (!enderecos.length || enderecos.some(e => enderecoInterno(e.address))) throw new Error('IMAGE_URL_BLOCKED: esse endereço não pode ser usado.');
  const resposta = await fetch(url, { redirect: 'error', signal: AbortSignal.timeout(8000), headers: { Accept: 'image/*' } })
    .catch(() => { throw new Error('IMAGE_URL_UNAVAILABLE: não foi possível baixar a imagem desse link.'); });
  const mime = (resposta.headers.get('content-type') || '').split(';')[0]?.trim().toLowerCase() ?? '';
  if (!resposta.ok || !TIPOS.has(mime)) throw new Error('IMAGE_URL_UNSUPPORTED: o link precisa ser uma imagem PNG, JPEG, GIF ou WebP.');
  const dados = Buffer.from(await resposta.arrayBuffer());
  if (dados.length > LIMITE) throw new Error('IMAGE_URL_TOO_LARGE: a imagem passa de 2 MB.');
  return { mime, base64: dados.toString('base64') };
}
