/** Busca os conhecimentos aprovados que mais combinam com a pergunta. */
import { listarConhecimentos } from './listarConhecimentos.js';
import { raizDaPalavra } from '../regras/textosDoConhecimento.js';
import { termosDaFrase } from '../regras/textosDoConhecimento.js';
import { Conhecimento } from '../tipos/conhecimento.js';
import { semAcentos } from '../../compartilhado/texto.js';

/** Conhecimentos APROVADOS do agente (ou gerais) mais ligados à pergunta. Pontua título em dobro; exige ao menos 2 pontos. */
export function conhecimentosRelevantes(espacoId: string | null, agente: string | null, pergunta: string, limite = 2, base?: string): Conhecimento[] {
  const ts = termosDaFrase(pergunta).map(raizDaPalavra); if (!ts.length) return [];
  const todos = listarConhecimentos({ espacoId, agente, estados: ['APROVADO'] }, base);
  return todos.map((c) => { const t = semAcentos(c.titulo), x = semAcentos(c.texto); return { c, p: ts.reduce((n, k) => n + (t.includes(k) ? 2 : 0) + (x.includes(k) ? 1 : 0), 0) + (c.agente === agente ? 1 : 0) }; })
    .filter((x) => x.p >= 3).sort((a, b) => b.p - a.p).slice(0, limite).map((x) => x.c);
}
