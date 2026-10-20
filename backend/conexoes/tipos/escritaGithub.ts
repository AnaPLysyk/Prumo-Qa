/** Tipos de escrita externa e caminhos permitidos — arquivos relacionados agrupados para manutenção. */
import { z } from "zod";
import { caminhoDeTesteValido } from "../github/caminhoDeTesteValido.js";
import { Servico } from "../../projetos/contratos.js";

// ── escritaGithub ──
const ramo = z.string().regex(/^prumo\/[a-z0-9][a-z0-9._/-]{2,78}$/).refine(r => !r.includes('..') && !r.endsWith('/') && !r.endsWith('.lock'), 'ramo inválido');

const ramoBase = z.string().regex(/^[A-Za-z0-9][A-Za-z0-9._/-]{0,100}$/).refine(r => !r.includes('..'), 'ramo inválido');

export const sha40 = z.string().regex(/^[a-f0-9]{40}$/);

export const criarBranch = z.object({ nome: ramo, base: ramoBase.optional() }).strict();

export const commitar = z.object({ branch: ramo, caminho: z.string().min(3).max(300), conteudo: z.string().max(256 * 1024), mensagem: z.string().trim().min(3).max(200) }).strict().refine(p => caminhoDeTesteValido(p.caminho), 'caminho não permitido');

// Rótulos de issue: nomes curtos, sem vírgula (a API de listagem usa vírgula como separador).
const rotuloIssue = z.string().trim().min(1).max(50).regex(/^[^,\n\r]+$/);

export const criarIssue = z.object({ titulo: z.string().trim().min(3).max(256), corpo: z.string().max(60000).default(''), rotulos: z.array(rotuloIssue).max(10).default([]) }).strict();

export const abrirPr = z.object({ branch: ramo, base: ramoBase.optional(), titulo: z.string().trim().min(3).max(200), corpo: z.string().max(8000).default(''), rascunho: z.boolean().default(true) }).strict();

// ── rotasDeEscrita ──
/**
 * Lista fechada das únicas escritas remotas que o Prumo sabe fazer. Cada rota é método + caminho exatos, sem query string.
 * Conferida contra a documentação oficial: Jira Cloud REST v3 (developer.atlassian.com), Qase TestOps API v1 (qase-tms/specs) e GitHub REST
 * (docs.github.com, versão 2022-11-28). O transporte recusa qualquer outra combinação com SERVICE_WRITE_BLOCKED, mesmo que um adaptador peça.
 * Nenhuma rota apaga recurso, altera permissões ou mexe em configuração: só cria ou complementa o que a pessoa autorizou.
 */
export type MetodoEscrita = 'POST' | 'PUT' | 'PATCH';

const chave = '[A-Z][A-Z0-9_]*-\\d+';

const codigoQase = '[A-Z][A-Z0-9]{1,9}';

const dono = '[A-Za-z0-9_.-]{1,100}';

export const rotas: Record<Servico, { metodo: MetodoEscrita; caminho: RegExp }[]> = {
  jira: [
    { metodo: 'POST', caminho: /^\/rest\/api\/3\/issue$/ },
    { metodo: 'POST', caminho: new RegExp(`^/rest/api/3/issue/${chave}/comment$`) },
    { metodo: 'POST', caminho: new RegExp(`^/rest/api/3/issue/${chave}/attachments$`) },
    { metodo: 'PUT', caminho: new RegExp(`^/rest/api/3/issue/${chave}$`) },
    { metodo: 'POST', caminho: new RegExp(`^/rest/api/3/issue/${chave}/transitions$`) },
    { metodo: 'POST', caminho: /^\/rest\/api\/3\/issueLink$/ }
  ],
  qase: [
    { metodo: 'POST', caminho: new RegExp(`^/v1/(case|suite|plan|run|defect)/${codigoQase}$`) },
    { metodo: 'PATCH', caminho: new RegExp(`^/v1/case/${codigoQase}/\\d{1,15}$`) },
    { metodo: 'PATCH', caminho: new RegExp(`^/v1/defect/${codigoQase}/status/\\d{1,15}$`) },
    { metodo: 'POST', caminho: new RegExp(`^/v1/run/${codigoQase}/\\d{1,15}/complete$`) },
    { metodo: 'POST', caminho: new RegExp(`^/v1/result/${codigoQase}/\\d{1,15}$`) },
    { metodo: 'POST', caminho: new RegExp(`^/v1/result/${codigoQase}/\\d{1,15}/bulk$`) },
    { metodo: 'POST', caminho: new RegExp(`^/v1/attachment/${codigoQase}$`) },
    { metodo: 'POST', caminho: new RegExp(`^/v1/case/${codigoQase}/external-issue/attach$`) }
  ],
  github: [
    { metodo: 'POST', caminho: new RegExp(`^/repos/${dono}/${dono}/git/refs$`) },
    { metodo: 'PUT', caminho: new RegExp(`^/repos/${dono}/${dono}/contents/[^?#]{1,500}$`) },
    { metodo: 'POST', caminho: new RegExp(`^/repos/${dono}/${dono}/pulls$`) },
    { metodo: 'POST', caminho: new RegExp(`^/repos/${dono}/${dono}/issues$`) }
  ]
};
