/** Canal conversas:listar: Listar os atendimentos da pessoa da sessão com um agente (sem texto), para o Cérebro e o Painel de atividades. */
import { listarAtendimentos } from '../banco/listarAtendimentos.js';
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';

// Só os atendimentos (sem texto) da pessoa da sessão. As conversas com texto gravadas até a 2.9 são de antes do login, sem dono: ficam no disco e não aparecem para ninguém (2.17).
export const conversasListar: TratadorDoCanal<'conversas:listar'> = a => { let atend: ReturnType<typeof listarAtendimentos> = []; try { atend = listarAtendimentos(a.espacoId, a.agente, 40); } catch { atend = []; }
  return [...atend.map(x => ({ id: 'atendimento-' + x.id, em: x.em, agente: x.agente, pergunta: '', linhas: [] as string[], fontes: x.fontes.map(f => ({ rotulo: f, aba: '' })), modo: x.modo, estilo: 'amigavel', semTexto: true, avaliacao: x.avaliacao }))]
    .sort((x, y) => y.em.localeCompare(x.em)).slice(0, 40); };
