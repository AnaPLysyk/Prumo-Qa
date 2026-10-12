/** Erro do Prumo com um código fixo (ex.: PATH_FORBIDDEN) para a tela e a IA saberem exatamente o que aconteceu. */

export class ErroQa extends Error {
  constructor(public codigo: string, mensagem: string) { super(mensagem); }
}
