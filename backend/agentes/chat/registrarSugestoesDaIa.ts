/** Guarda aprendizados sugeridos pela IA apenas como rascunhos que exigem aprovação. */
import { registrarConhecimento } from '../banco/registrarConhecimento.js';
import { Acao, Opcoes, Provedor } from '../tipos/chat.js';
import { AgenteChat } from '../tipos/persona.js';

export function registrarSugestoesDaIa(o: Opcoes, agente: AgenteChat, provedor: Exclude<Provedor, 'local'>, aprendizados: string[]): { acoes: Acao[]; sugeridos: number; naoRegistrados: number } {
    const acoes: Acao[] = []; let sugeridos = 0; let naoRegistrados = 0;
    for (const a of aprendizados) { try { const { item, duplicado } = registrarConhecimento({ espacoId: o.espacoId, agente: agente.id === 'orquestrador' ? null : agente.id, tipo: 'fato', titulo: a.slice(0, 80), texto: a, origem: 'IA', cliente: provedor }, o.base);
      if (!duplicado && item.estado === 'RASCUNHO') { sugeridos++; acoes.push({ tipo: 'aprovar_conhecimento', id: item.id, rotulo: 'Aprovar: ' + item.titulo.slice(0, 40) }, { tipo: 'descartar_conhecimento', id: item.id, rotulo: 'Descartar' }); } } catch { naoRegistrados++; } }
    return { acoes, sugeridos, naoRegistrados };
}
