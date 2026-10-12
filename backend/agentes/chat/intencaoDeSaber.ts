/** Reconhece perguntas como "o que você sabe?" e lista os conhecimentos do agente. */
import { listarConhecimentos } from '../banco/listarConhecimentos.js';
import { escolherAgente } from './escolherAgente.js';
import { Meta } from '../tipos/chat.js';
import { Conhecimento } from '../tipos/conhecimento.js';
import { tentarOuPadrao } from '../../compartilhado/erros/tentarOuPadrao.js';
import { semAcentos } from '../../compartilhado/texto/semAcentos.js';

export function intencaoDeSaber(pergunta: string, espacoId: string | null, forcado: string | null | undefined, base?: string): Meta | null {
  const t = semAcentos(pergunta); if (!/o que (voce|vc) (sabe|aprendeu|conhece|lembra)|seus conhecimentos|o que (eu )?te ensinei|o que voce anotou/.test(t)) return null;
  const alvo = forcado ?? escolherAgente(t.replace(/o que (voce|vc) (sabe|aprendeu|conhece|lembra)( sobre)?/, '')).agente.id; const agente = alvo === 'orquestrador' ? null : alvo;
  const itens = tentarOuPadrao(() => listarConhecimentos({ espacoId, agente, estados: ['APROVADO', 'RASCUNHO'] }, base), [] as Conhecimento[]);
  const aprov = itens.filter((c) => c.estado === 'APROVADO'), rasc = itens.filter((c) => c.estado === 'RASCUNHO'); const meus = aprov.filter((c) => c.origem !== 'PRUMO');
  return { agente: alvo, fontes: [{ rotulo: 'Agentes', aba: 'agentes' }], linhas: [
    `Sei ${aprov.length} coisa(s) aprovada(s)${agente ? ' nesta especialidade' : ''}: ${aprov.length - meus.length} do conhecimento inicial do Prumo e ${meus.length} que você me ensinou${rasc.length ? `; ${rasc.length} rascunho(s) esperando sua decisão` : ''}.`,
    ...(meus.length ? [`Do que você me ensinou: ${meus.slice(0, 4).map((c) => c.titulo).join('; ')}.`] : []),
    'Tudo isso está no Cérebro de cada agente e no arquivo conhecimento.db.'] };
}
