/** Guarda, lê e apaga as credenciais do Jira, Qase e GitHub protegidas pelo Windows (DPAPI); nunca em texto aberto. */
import { Protetor } from '../tipos/credenciais.js';
import { lerCredencial } from './lerCredencial.js';
import { removerCredencial } from './removerCredencial.js';
import { salvarCredencial } from './salvarCredencial.js';

// Cada ação está no seu arquivo; aqui só se fixa o protetor do Windows e a pasta de dados.
export function cofreCredenciais(protetor: Protetor, base?: string) {
  return {
    salvar: (id: string, valor: string) => salvarCredencial(protetor, id, valor, base),
    ler: (id: string) => lerCredencial(protetor, id, base),
    remover: (id: string) => removerCredencial(id, base),
  };
}
