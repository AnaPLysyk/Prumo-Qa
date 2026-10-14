/** O que a janela de senha do Windows mostra para a pessoa aprovar: projeto, pasta, capacidade, comando, hash e validade. */

export type EscopoAprovacao = { projectId:string; root:string; capability:string; scopeHash:string; command:string; expiresAt:string };

/** Resultado de uma aprovação humana: quem aprovou, por qual mecanismo do sistema, o escopo aprovado e quando. */
export type Aprovacao = { subject:string; method:string; scopeHash:string; at:string };
