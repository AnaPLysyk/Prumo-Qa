/** Abre a conversa com o serviço de uma conta usando a credencial guardada no cofre do Windows (ela não sai do adaptador). */
import { AdaptadorServico } from '../integracoes/AdaptadorServico.js';
import { Conta, ContextoDosServicos } from '../tipos/contaDeServico.js';

export function adaptadorDaConta(c: ContextoDosServicos, conta: Conta) {
  return new AdaptadorServico({ ...conta, token: c.cofre.ler(conta.id) }, c.transporte, c.escrita);
}
