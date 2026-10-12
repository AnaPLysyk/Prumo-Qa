/** Nome do usuário do Windows, lido aqui (nunca informado pela página), usado como aprovador. */
import os from 'node:os';

// ---- Contextos persistentes (2.4). Aprovar, desatualizar, excluir e habilitar o MCP exigem confirmação NATIVA
// (a página não a simula). O aprovador é o usuário do Windows, lido aqui no processo principal, nunca informado pela página. ----
export const usuarioDoWindows = () => os.userInfo().username;
