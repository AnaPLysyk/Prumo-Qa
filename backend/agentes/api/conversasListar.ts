/** Canal conversas:listar: Listar os atendimentos de um agente (sem texto, desde a 2.10) e as conversas gravadas até a 2.9, para o Cérebro e o Painel de atividades. */
import { conversasDoAgente } from '../banco/conversasDoAgente.js';
import { listarAtendimentos } from '../banco/listarAtendimentos.js';
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';

// Conversas gravadas até a 2.9 continuam legíveis; desde a 2.10 entram só os atendimentos (sem texto).
export const conversasListar: TratadorDoCanal<'conversas:listar'> = a => { let atend: ReturnType<typeof listarAtendimentos> = []; try { atend = listarAtendimentos(a.espacoId, a.agente, 40); } catch { atend = []; }
  return [...atend.map(x => ({ id: 'atendimento-' + x.id, em: x.em, agente: x.agente, pergunta: '', linhas: [] as string[], fontes: x.fontes.map(f => ({ rotulo: f, aba: '' })), modo: x.modo, estilo: 'amigavel', semTexto: true, avaliacao: x.avaliacao })), ...conversasDoAgente(a.espacoId, a.agente).map(c => ({ ...c, semTexto: false, avaliacao: null }))]
    .sort((x, y) => y.em.localeCompare(x.em)).slice(0, 40); };
