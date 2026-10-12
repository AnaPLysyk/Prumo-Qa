/** Descreve os dados já verificados usados somente na delegação do chat para IA externa. */
import { Perfil } from './conhecimento.js';
import { AgenteChat } from './persona.js';
import { Coleta, Estilo, Opcoes, Provedor, Resposta, Turno } from './chat.js';

export type ContextoDelegacao = {
  o: Opcoes;
  agente: AgenteChat;
  pergunta: string;
  local: Coleta;
  estilo: Estilo;
  nome: string;
  perfil: Perfil | null;
  historico: Turno[];
  comum: Pick<Resposta, 'rota' | 'continuou' | 'proximos'>;
  provedor: Exclude<Provedor, 'local'>;
  montar: (agente: AgenteChat, coleta: Coleta, modo: Resposta['modo'], extra?: Partial<Resposta> & { rota?: Resposta['rota'] }) => Resposta;
  vestido: () => string[];
};
