/** Escolhe o agente que responde: o escolhido pela pessoa, o da conversa anterior ou o de palavras mais parecidas. */
import { palavrasDaPergunta } from './interpretarPergunta.js';
import { termoCasaComPergunta } from './interpretarPergunta.js';
import { SEGUIMENTO, Turno } from '../tipos/chat.js';
import { agentesChat } from '../tipos/persona.js';
import { semAcentos } from '../../compartilhado/texto.js';

/**
 * Pontua cada agente pelas palavras da pergunta. Menção explícita (@id ou nome) decide; termos que a pessoa ensinou ao
 * corrigir o agente somam até 6 pontos. Pergunta de seguimento ("e o segundo?") sem sinal forte fica com o agente anterior.
 */
export function escolherAgente(pergunta: string, forcado?: string | null, extras: { historico?: Turno[]; aprendidos?: Record<string, number>; desligados?: readonly string[] } = {}) {
  const ativos = agentesChat.filter((a) => a.id === 'orquestrador' || !extras.desligados?.includes(a.id));
  const p = semAcentos(pergunta); const palavras = palavrasDaPergunta(pergunta); const frase = palavras.join(' ');
  const rota = ativos.map((a) => ({ agente: a.id, pontos: a.palavras.reduce((n, k) => { const forte = k.startsWith('!'), w = forte ? k.slice(1) : k; return n + (termoCasaComPergunta(w, palavras, frase) ? (forte ? 3 : w.replace('~', '').length > 5 ? 2 : 1) : 0); }, 0)
    + (p.includes('@' + a.id) || p.includes('agente ' + semAcentos(a.nome)) || (a.nome.includes(' ') && p.includes(semAcentos(a.nome))) ? 10 : 0) + Math.min(6, extras.aprendidos?.[a.id] ?? 0) })).sort((x, y) => y.pontos - x.pontos);
  const topo = rota[0]!; const ultimo = extras.historico?.at(-1); let continuou = false;
  let escolhido = forcado ? ativos.find((a) => a.id === forcado) : undefined;
  if (!escolhido && ultimo && topo.pontos < 3 && (SEGUIMENTO.test(frase) || (palavras.length <= 3 && topo.pontos === 0))) { escolhido = ativos.find((a) => a.id === ultimo.agente); continuou = !!escolhido; }
  escolhido ??= (topo.pontos > 0 ? ativos.find((a) => a.id === topo.agente) : undefined) ?? ativos[0]!;
  return { agente: escolhido, rota: rota.filter((r) => r.pontos > 0).slice(0, 4), continuou };
}
