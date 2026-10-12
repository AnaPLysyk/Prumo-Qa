/** Diz se um endereço de download é permitido (só GitHub oficial, ou 127.0.0.1 em teste). */
import { HOSTS } from '../tipos/instalador.js';

export function downloadPermitido(url: URL, permitirLocal: boolean) {
  if (url.username || url.password || url.port) return permitirLocal && url.protocol === 'http:' && url.hostname === '127.0.0.1';
  if (url.protocol === 'https:' && HOSTS.has(url.hostname)) return true;
  return permitirLocal && url.protocol === 'http:' && url.hostname === '127.0.0.1';
}
