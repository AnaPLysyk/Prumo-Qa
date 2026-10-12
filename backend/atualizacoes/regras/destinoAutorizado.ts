/** Confere que a consulta vai só ao endereço fixo das releases do Prumo (ou ao servidor local de teste). */
import { repositorio } from '../../ajuda/tipos/versoes.js';

/** Destino autorizado: fixo. Em desenvolvimento, testes podem usar um servidor em 127.0.0.1 (permitirLocal). */
export function destinoAutorizado(url: string, permitirLocal = false): boolean {
  let u: URL; try { u = new URL(url); } catch { return false; }
  if (u.protocol === 'https:' && u.hostname === 'api.github.com' && u.pathname === `/repos/${repositorio}/releases/latest` && !u.search && !u.username && !u.password && !u.port) return true;
  return permitirLocal && u.protocol === 'http:' && u.hostname === '127.0.0.1';
}
