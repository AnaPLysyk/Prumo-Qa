/** O que a janela de senha do Windows mostra para a pessoa aprovar: projeto, pasta, capacidade, comando, hash e validade. */

export type EscopoAprovacao = { projectId:string; root:string; capability:string; scopeHash:string; command:string; expiresAt:string };
