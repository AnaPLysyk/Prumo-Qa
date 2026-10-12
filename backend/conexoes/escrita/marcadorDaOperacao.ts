/** Marcador "prumo-xxxxxxxxxx" posto no item criado, para reconhecê-lo depois e não duplicar. */

export const marcadorDaOperacao = (chave: string) => 'prumo-' + chave.slice(0, 10);
