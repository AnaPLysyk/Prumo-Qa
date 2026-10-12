/** Cria uma proposta em rascunho, apontando semelhantes e limitando quantas a IA pode criar por hora. */
import { randomUUID } from 'node:crypto';
import { mascarar } from '../../compartilhado/seguranca/mascarar.js';
import { obterEspaco } from '../../projetos/banco/obterEspaco.js';
import { gravarPropostas } from '../banco/gravarPropostas.js';
import { lerPropostas } from '../banco/lerPropostas.js';
import { palavrasDoTexto } from './palavrasDoTexto.js';
import { semelhancaEntrePalavras } from './semelhancaEntrePalavras.js';
import { textoComparavel } from './textoComparavel.js';
import { validarDadosDaProposta } from './validarDadosDaProposta.js';
import { MAX_IA_POR_HORA, MAX_PROPOSTAS, NovaProposta, Proposta, propostaSchema } from '../tipos/proposta.js';

export function criarProposta(n: NovaProposta, b?: string, agora = new Date()): Proposta {
  obterEspaco(n.espacoId, b); const dados = validarDadosDaProposta(n.tipo, n.dados) as Record<string, unknown>; const titulo = mascarar(String(n.tipo === 'caso' ? (dados as { titulo: string }).titulo : (dados as { resumo: string }).resumo)).slice(0, 255);
  const r = lerPropostas(b); const doEspaco = r.itens.filter(p => p.espacoId === n.espacoId && p.estado !== 'DESCARTADA');
  if (doEspaco.length >= MAX_PROPOSTAS) throw new Error('PROPOSAL_LIMIT');
  if (n.origem === 'IA' && doEspaco.filter(p => p.origem === 'IA' && agora.getTime() - Date.parse(p.criadaEm) < 3600000).length >= MAX_IA_POR_HORA) throw new Error('PROPOSAL_RATE_LIMIT: limite de propostas por hora atingido; revise as pendentes antes de propor mais.');
  const alvo = textoComparavel(titulo); const t = palavrasDoTexto(titulo);
  const mesmaCoisa = doEspaco.find(p => p.tipo === n.tipo && textoComparavel(p.titulo) === alvo); if (mesmaCoisa) throw new Error('DUPLICATE_PROPOSAL: já existe uma proposta com o mesmo título neste projeto.');
  const similares = doEspaco.filter(p => p.tipo === n.tipo && semelhancaEntrePalavras(t, palavrasDoTexto(p.titulo)) >= 0.7).map(p => p.id).slice(0, 10);
  const p: Proposta = propostaSchema.parse({ id: randomUUID(), espacoId: n.espacoId, tipo: n.tipo, origem: n.origem, ...(n.cliente ? { cliente: n.cliente.slice(0, 60) } : {}), estado: 'RASCUNHO', titulo, dados, requisito: mascarar(n.requisito ?? '').slice(0, 500), risco: mascarar(n.risco ?? '').slice(0, 300), similares, revisao: null, remoto: null, ...(n.falhaDeOrigem ? { falhaDeOrigem: n.falhaDeOrigem } : {}), criadaEm: agora.toISOString(), atualizadaEm: agora.toISOString() });
  r.itens.push(p); gravarPropostas(r, b); return p;
}
