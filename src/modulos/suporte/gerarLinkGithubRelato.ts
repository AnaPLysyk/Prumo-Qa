/** Monta e valida links oficiais dos formulários GitHub Issues. */
import { repositorio } from '../../versoes.js';
import { rotulo, modelo, urlBase, limiteUrl, type Solicitacao } from './definirSolicitacao.js';
import { montarCorpo } from './montarTextoRelato.js';

/** Endereço oficial do formulário do GitHub com os campos do template preenchidos (ids: descricao, esperado, passos, ambiente). */
export function montarUrl(s: Solicitacao, corpo: ReturnType<typeof montarCorpo>) {
  const q = new URLSearchParams({ template: modelo[s.categoria], title: `[${rotulo[s.categoria]}] ${s.titulo}` });
  let truncado = false;
  for (const [id, valor] of [['descricao', corpo.descricao], ['esperado', corpo.esperado], ['passos', corpo.passos], ['ambiente', corpo.ambiente]] as const) {
    if (!valor) continue; let v: string = valor;
    q.set(id, v);
    while (`${urlBase}?${q}`.length > limiteUrl && v.length > 200) { v = v.slice(0, Math.floor(v.length * 0.8)); q.set(id, v + '…'); truncado = true; }
  }
  return { url: `${urlBase}?${q}`, truncado };
}
/** Validação do endereço antes de abrir: só o formulário oficial do repositório, em https. */
export function urlOficial(url: string) {
  try { const u = new URL(url); return u.protocol === 'https:' && u.hostname === 'github.com' && u.pathname === `/${repositorio}/issues/new` && !u.username && !u.port && u.hash === ''; } catch { return false; }
}
const padraoLink = new RegExp(`^https://github\\.com/${repositorio.replace('/', '\\/').replace('.', '\\.')}/issues/\\d{1,9}$`);
export const linkDeIssueValido = (l: string) => padraoLink.test(l);

