/** Confere que o endereço é exatamente o formulário oficial de issues do Prumo no GitHub. */
import { repositorio } from '../../ajuda/contratos.js';

/** Validação do endereço antes de abrir: só o formulário oficial do repositório, em https. */
export function enderecoOficialDoRelato(url: string) {
  try { const u = new URL(url); return u.protocol === 'https:' && u.hostname === 'github.com' && u.pathname === `/${repositorio}/issues/new` && !u.username && !u.port && u.hash === ''; } catch { return false; }
}
