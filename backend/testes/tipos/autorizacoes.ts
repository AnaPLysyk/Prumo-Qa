/** Contratos de autorização de execuções: escopo, aprovação humana e delegação. */


/** Formato da autorização delegada: reconhece um consentimento humano prévio, restrito ao escopo exato. */

/** Devolve quem aprovou, como e quando, ou null se não houver autorização vigente; nunca cria aprovação. */
export type Delegada=(escopo:{scopeHash:string;capability:string;command:string})=>Promise<{subject:string;method:string;scopeHash:string;at:string}|null>;

/** O que a janela de senha do Windows mostra para a pessoa aprovar: projeto, pasta, capacidade, comando, hash e validade. */

export type EscopoAprovacao = { projectId:string; root:string; capability:string; scopeHash:string; command:string; expiresAt:string };

/** Resultado de uma aprovação humana: quem aprovou, por qual mecanismo do sistema, o escopo aprovado e quando. */
export type Aprovacao = { subject:string; method:string; scopeHash:string; at:string };
