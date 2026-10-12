/** Junta conhecimentos aprovados à resposta local e registra suas fontes sem duplicar fatos. */
import { Opcoes, Coleta } from '../tipos/chat.js';
import { AgenteChat } from '../tipos/persona.js';
import { Conhecimento } from '../tipos/conhecimento.js';
import { conhecimentosRelevantes } from '../banco/conhecimentosRelevantes.js';
import { tentarOuPadrao } from '../../compartilhado/erros/tentarOuPadrao.js';
import { semAcentos } from '../../compartilhado/texto/semAcentos.js';

export function juntarConhecimentos(o: Opcoes, agente: AgenteChat, pergunta: string, historico: NonNullable<Opcoes['historico']>, continuou: boolean, local: Coleta): void {
  // Seguimento ("e mais?"): busca pela pergunta anterior e mostra o que ainda não foi dito (do 2º item em diante).
  const anterior = continuou ? historico.at(-1)?.pergunta ?? '' : '';
  const rel = tentarOuPadrao(() => anterior ? conhecimentosRelevantes(o.espacoId, agente.id === 'orquestrador' ? null : agente.id, anterior, 4, o.base).slice(1, 3) : conhecimentosRelevantes(o.espacoId, agente.id === 'orquestrador' ? null : agente.id, pergunta, 2, o.base), [] as Conhecimento[]);
  if (rel.length) {
    const sabidas = rel.map((c) => `${c.origem === 'PRUMO' ? 'Do que eu sei' : 'Do que você me ensinou'} — ${semAcentos(c.texto).startsWith(semAcentos(c.titulo)) ? '' : c.titulo + ': '}${c.texto.length > 420 ? c.texto.slice(0, 420) + '…' : c.texto}`);
    if (local.generico || local.vazio) local.linhas = sabidas; else local.linhas.push(...sabidas);
    if (!local.fontes.some((f) => f.aba === 'agentes')) local.fontes.push({ rotulo: 'Cérebro', aba: 'agentes' }); local.fatos.push(`conhecimentos=${rel.length}`);
  }
  if (continuou && !rel.length) local.linhas.push('Sobre isso não tenho mais nada registrado. Posso chamar outro agente, ou você me ensina com "lembra que…".');
}
