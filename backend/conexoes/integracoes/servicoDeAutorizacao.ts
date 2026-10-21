/** Cliente do serviço do Prumo para autorizar GitHub e Jira pelo navegador: o segredo do aplicativo oficial fica só no servidor. */
import { z } from "zod";
import { chamarServicoDoPrumo, usarAutenticacaoRemota } from "../../login/integracoes/autenticacaoRemota.js";
import { CredencialOAuth, RenovadorOAuth, RevogadorOAuth, credencialOAuthSchema } from "../tipos/contaDeServico.js";
import { FormatoServicoOAuth } from "../tipos/autorizacao.js";
import { respostaDeInicio, respostaDeEstado, respostaDeRetirada, respostaDeDisponiveis } from "../tipos/autorizacao.js";

/** Sem o serviço central configurado (login local legado), a autorização pelo navegador não existe e a tela mostra o caminho manual. */
export const autorizacaoPeloNavegadorDisponivel = () => usarAutenticacaoRemota();

/** Quais serviços já têm o aplicativo oficial configurado no serviço do Prumo; qualquer falha (serviço antigo, sem sessão, sem rede) vale como "nenhum". */
export async function disponiveisNoServico() {
  try { return respostaDeDisponiveis.parse(await chamarServicoDoPrumo("/v1/integracoes/disponiveis")); }
  catch { return { github: false, jira: false }; }
}

export async function iniciarNoServico(servico: FormatoServicoOAuth) {
  return respostaDeInicio.parse(await chamarServicoDoPrumo("/v1/integracoes/iniciar", { servico }));
}

export async function estadoNoServico(tentativa: string) {
  return respostaDeEstado.parse(await chamarServicoDoPrumo("/v1/integracoes/estado?tentativa=" + encodeURIComponent(tentativa)));
}

/** O servidor entrega as credenciais uma única vez e apaga a cópia; quem chama as guarda no cofre do sistema. */
export async function retirarDoServico(tentativa: string) {
  return respostaDeRetirada.parse(await chamarServicoDoPrumo("/v1/integracoes/retirar", { tentativa }));
}

export const renovarPeloServico: RenovadorOAuth = async (servico, renovacao) =>
  credencialOAuthSchema.parse(await chamarServicoDoPrumo("/v1/integracoes/renovar", { servico, renovacao })) as CredencialOAuth;

export const revogarPeloServico: RevogadorOAuth = async (servico, acesso) => {
  z.object({ revogado: z.boolean() }).parse(await chamarServicoDoPrumo("/v1/integracoes/revogar", { servico, acesso }));
};
