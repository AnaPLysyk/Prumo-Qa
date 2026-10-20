/** Simula o caminho de uma pergunta no chat, sem responder: palavras, pontuação de cada agente, orquestração e o que o agente em foco usaria. */
import { conhecimentosRelevantes } from '../banco/operacoesDeConhecimento.js';
import { listarTrechosDeSkill } from '../banco/operacoesDeSkills.js';
import { pesosAprendidos } from '../repositorioAprendizados.js';
import { sementeDasSkills } from '../banco/sementeDasSkills.js';
import { escolherAgente } from './selecaoDoAgente.js';
import { palavrasDaPergunta } from './roteamentoDePerguntas.js';
import { planejarOrquestracao } from './roteamentoDePerguntas.js';
import { termoCasaComPergunta } from './roteamentoDePerguntas.js';
import { escolherTrechosDaSkill } from '../regras/regrasDasSkills.js';
import { raizDaPalavra } from '../regras/normalizacaoDoConhecimento.js';
import { termosDaFrase } from '../regras/normalizacaoDoConhecimento.js';
import { agentesChat } from '../tipos/persona.js';
import { tentarOuPadrao } from './tentarOuPadrao.js';
import { semAcentos } from '../../compartilhado/texto.js';

type Rastro = {
  pergunta: string; palavras: string[]; termos: string[];
  escolhido: { id: string; nome: string; porPadrao: boolean };
  rota: { agente: string; nome: string; pontos: number; casou: { termo: string; pontos: number }[]; mencao: boolean; aprendidos: number }[];
  orquestracao: string[] | null;
  foco: { agente: string; responderia: boolean; conhecimentos: { id: string; titulo: string }[]; skill: { usados: string[]; omitidos: number; origem: 'BANCO' | 'ARQUIVOS' } } | null;
};

/**
 * Usa as mesmas funções do chat (escolherAgente, planejarOrquestracao, conhecimentosRelevantes, escolherTrechosDaSkill),
 * então o rastro mostra o que o chat faria agora. Não chama IA, não grava conversa, atendimento nem aprendizado.
 * Fora do rastro: histórico da sessão e pedidos sobre a própria relação (nome, papel, "lembre que", "o que você sabe").
 */
export function rastrearPergunta(pergunta: string, espacoId: string | null, foco: string | null, base?: string): Rastro {
  const texto = pergunta.trim(); const palavras = palavrasDaPergunta(texto); const frase = palavras.join(' '); const p = semAcentos(texto);
  const aprendidos = tentarOuPadrao(() => pesosAprendidos(texto, base), {} as Record<string, number>);
  const r = escolherAgente(texto, null, { aprendidos });
  const rota = agentesChat.map((a) => {
    const casou = a.palavras.map((k) => { const forte = k.startsWith('!'), w = forte ? k.slice(1) : k; return termoCasaComPergunta(w, palavras, frase) ? { termo: w.replace('~', ''), pontos: forte ? 3 : w.replace('~', '').length > 5 ? 2 : 1 } : null; })
      .filter((x): x is { termo: string; pontos: number } => !!x);
    const mencao = p.includes('@' + a.id) || p.includes('agente ' + semAcentos(a.nome)) || (a.nome.includes(' ') && p.includes(semAcentos(a.nome)));
    const extra = Math.min(6, aprendidos[a.id] ?? 0);
    return { agente: a.id, nome: a.nome, pontos: casou.reduce((n, c) => n + c.pontos, 0) + (mencao ? 10 : 0) + extra, casou, mencao, aprendidos: extra };
  }).filter((x) => x.pontos > 0).sort((a, b) => b.pontos - a.pontos);
  const agenteFoco = foco ? agentesChat.find((a) => a.id === foco) : undefined;
  let focoRastro: Rastro['foco'] = null;
  if (agenteFoco) {
    const esp = agenteFoco.especializacao ?? 'qa-geral';
    const conhecimentos = tentarOuPadrao(() => conhecimentosRelevantes(espacoId, agenteFoco.id, texto, 5, base), []).map((c) => ({ id: c.id, titulo: c.titulo }));
    let skill: NonNullable<Rastro['foco']>['skill'];
    try { const e = escolherTrechosDaSkill(listarTrechosDeSkill({ especializacao: esp, estados: ['APROVADO'] }, base), texto); skill = { usados: e.usados, omitidos: e.omitidos, origem: 'BANCO' }; }
    catch { const e = escolherTrechosDaSkill(sementeDasSkills().filter((t) => t.especializacao === esp), texto); skill = { usados: e.usados, omitidos: e.omitidos, origem: 'ARQUIVOS' }; }
    focoRastro = { agente: agenteFoco.id, responderia: r.agente.id === agenteFoco.id, conhecimentos, skill };
  }
  return { pergunta: texto, palavras, termos: termosDaFrase(texto).map(raizDaPalavra), escolhido: { id: r.agente.id, nome: r.agente.nome, porPadrao: !r.rota.length }, rota, orquestracao: planejarOrquestracao(r.rota), foco: focoRastro };
}
