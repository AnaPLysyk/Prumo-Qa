/** Abre a conversa: cumprimenta pelo nome, resume a situação e pergunta o que falta saber da pessoa. */
import { lerPerfil } from '../banco/lerPerfil.js';
import { nomeParaChamar } from './nomeParaChamar.js';
import { proximosPassosSugeridos } from './proximosPassosSugeridos.js';
import { Pendente, Proximo } from '../tipos/chat.js';
import { tentarOuPadrao } from './tentarOuPadrao.js';
import { situacaoDoProjeto } from '../../inicio/servico.js';

/** Abertura da conversa: cumprimenta pelo nome (o do Meu perfil ou o da conta que entrou), resume a situação e pergunta o que ainda falta saber. */
export function saudacao(espacoId: string | null, nomeAssistente = 'Prumo', base?: string): { linhas: string[]; pendente: Pendente; proximos: Proximo[]; pessoa: string | null } {
  const perfil = tentarOuPadrao(() => lerPerfil(base), null); const pessoa = nomeParaChamar(perfil, base); const nome = nomeAssistente.slice(0, 40);
  const linhas = [pessoa ? `Oi, ${pessoa}! Aqui é ${nome}.` : `Olá! Sou ${nome}, seu colega de qualidade neste computador.`, ...situacaoDoProjeto(espacoId, base)];
  if (!pessoa) return { linhas: [...linhas, 'Antes de começarmos: como você quer que eu te chame?'], pendente: 'nome', proximos: [], pessoa };
  if (!perfil?.papel) return { linhas: [...linhas, 'Qual é o seu papel no time: QA, desenvolvimento, produto (PO) ou análise? Assim eu ajusto a conversa.'], pendente: 'papel', proximos: [], pessoa };
  const conheco = perfil.foco ? [`Vou priorizar ${perfil.foco} nas respostas.`] : [];
  return { linhas: [...linhas, ...conheco, 'Por onde começamos?'], pendente: null, proximos: proximosPassosSugeridos('orquestrador', [], perfil.papel, ''), pessoa };
}
