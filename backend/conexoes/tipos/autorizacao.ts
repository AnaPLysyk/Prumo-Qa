/** Formatos da autorização de GitHub e Jira pelo navegador: o que o serviço do Prumo devolve e o que a tela recebe. */
import { z } from "zod";
import { credencialOAuthSchema } from "./contaDeServico.js";

export const servicoOAuthSchema = z.enum(['github', 'jira']);

export type FormatoServicoOAuth = z.infer<typeof servicoOAuthSchema>;

const enderecoHttps = z.string().url().max(2000).refine(u => u.startsWith('https://'));

/** O app só abre no navegador as páginas oficiais de autorização e de instalação: um serviço comprometido não consegue mandar outro endereço. */
const paginaDeAutorizacao = enderecoHttps.refine(u => /^https:\/\/(?:github\.com\/login\/oauth\/authorize|auth\.atlassian\.com\/authorize)\?/.test(u));
const paginaDeInstalacao = enderecoHttps.refine(u => /^https:\/\/github\.com\/apps\/[A-Za-z0-9-]{1,60}\/installations\/new$/.test(u));

export const respostaDeInicio = z.object({ tentativa: z.string().regex(/^[A-Za-z0-9_-]{16,100}$/), url: paginaDeAutorizacao, instalarUrl: paginaDeInstalacao.optional() }).strict();

export const respostaDeDisponiveis = z.object({ github: z.boolean(), jira: z.boolean() }).strict();

export const respostaDeEstado = z.object({ estado: z.enum(['PENDENTE', 'PRONTO', 'NEGADO', 'ERRO', 'EXPIRADO']) }).strict();

/** Sites Jira que a pessoa autorizou (accessible-resources): id da nuvem, nome e endereço do site. */
export const siteJira = z.object({ id: z.string().uuid(), nome: z.string().min(1).max(200), url: enderecoHttps }).strict();

export const respostaDeRetirada = credencialOAuthSchema.extend({ sites: z.array(siteJira).max(50).optional() }).strict();

export type SiteJira = z.infer<typeof siteJira>;

/** Situação mostrada na tela Conexões; nunca carrega token. */
export type EstadoDaAutorizacao = {
  estado: 'INATIVO' | 'AGUARDANDO' | 'ESCOLHER_SITE' | 'CONECTADO' | 'CANCELADO' | 'EXPIRADO' | 'NEGADO' | 'ERRO';
  mensagem?: string;
  sites?: { id: string; nome: string; url: string }[];
  conta?: { id: string; nome: string; identidade: string };
  /** GitHub: a conta conectou, mas o aplicativo ainda não foi instalado em nenhum repositório. */
  instalarAplicativo?: boolean;
  /** O serviço central não está configurado para este serviço: a tela oferece o caminho manual. */
  indisponivel?: boolean;
};
