import type { Servico } from './espacos.js';

/**
 * Lista fechada das ÚNICAS escritas remotas que o Prumo sabe fazer (2.9). Cada rota é método + caminho exatos, sem query string.
 * Conferida contra a documentação oficial: Jira Cloud REST v3 (developer.atlassian.com), Qase TestOps API v1 (qase-tms/specs) e GitHub REST
 * (docs.github.com, versão 2022-11-28). O transporte recusa qualquer outra combinação com SERVICE_WRITE_BLOCKED, mesmo que um adaptador peça.
 * Nenhuma rota apaga recurso, altera permissões ou mexe em configuração: só cria ou complementa o que a pessoa autorizou.
 */
export type MetodoEscrita = 'POST' | 'PUT' | 'PATCH';
const chave = '[A-Z][A-Z0-9_]*-\\d+';
const codigoQase = '[A-Z][A-Z0-9]{1,9}';
const dono = '[A-Za-z0-9_.-]{1,100}';
const rotas: Record<Servico, { metodo: MetodoEscrita; caminho: RegExp }[]> = {
  jira: [
    { metodo: 'POST', caminho: /^\/rest\/api\/3\/issue$/ },
    { metodo: 'POST', caminho: new RegExp(`^/rest/api/3/issue/${chave}/comment$`) },
    { metodo: 'POST', caminho: new RegExp(`^/rest/api/3/issue/${chave}/attachments$`) },
    { metodo: 'PUT', caminho: new RegExp(`^/rest/api/3/issue/${chave}$`) },
    { metodo: 'POST', caminho: new RegExp(`^/rest/api/3/issue/${chave}/transitions$`) },
    { metodo: 'POST', caminho: /^\/rest\/api\/3\/issueLink$/ }
  ],
  qase: [
    { metodo: 'POST', caminho: new RegExp(`^/v1/(case|suite|plan|run)/${codigoQase}$`) },
    { metodo: 'PATCH', caminho: new RegExp(`^/v1/case/${codigoQase}/\\d{1,15}$`) },
    { metodo: 'POST', caminho: new RegExp(`^/v1/run/${codigoQase}/\\d{1,15}/complete$`) },
    { metodo: 'POST', caminho: new RegExp(`^/v1/result/${codigoQase}/\\d{1,15}$`) },
    { metodo: 'POST', caminho: new RegExp(`^/v1/result/${codigoQase}/\\d{1,15}/bulk$`) },
    { metodo: 'POST', caminho: new RegExp(`^/v1/attachment/${codigoQase}$`) },
    { metodo: 'POST', caminho: new RegExp(`^/v1/case/${codigoQase}/external-issue/attach$`) }
  ],
  github: [
    { metodo: 'POST', caminho: new RegExp(`^/repos/${dono}/${dono}/git/refs$`) },
    { metodo: 'PUT', caminho: new RegExp(`^/repos/${dono}/${dono}/contents/[^?#]{1,500}$`) },
    { metodo: 'POST', caminho: new RegExp(`^/repos/${dono}/${dono}/pulls$`) }
  ]
};
export function rotaEscritaPermitida(servico: Servico, metodo: string, caminho: string): boolean {
  if (/%2e|%2f|%5c|\.\.|[\x00-\x1f\\]/i.test(caminho)) return false; // sem traversal nem separadores codificados
  return rotas[servico].some(r => r.metodo === metodo && r.caminho.test(caminho));
}
export const operacoesDeEscritaPorServico = (servico: Servico) => rotas[servico].map(r => `${r.metodo} ${r.caminho.source}`);
