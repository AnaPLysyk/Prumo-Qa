/** Canal assistente:abertura: Abrir a conversa: cumprimentar pelo nome, resumir a situação do projeto e, se ainda não souber, perguntar como chamar a pessoa e o papel dela. */
import { saudacao } from '../../agentes/chat/saudacao.js';
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';
import { lerPreferencias } from '../../configuracoes/banco/lerPreferencias.js';

export const assistenteAbertura: TratadorDoCanal<'assistente:abertura'> = a => ({ ...saudacao(a.espacoId, lerPreferencias().ia.nome), assistente: lerPreferencias().ia.nome });
