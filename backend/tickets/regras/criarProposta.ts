/** Cria uma proposta em rascunho, identificando semelhantes e limitando propostas da IA. */
import { randomUUID } from 'node:crypto';
import { mascarar } from '../../compartilhado/seguranca/mascarar.js';
import { obterEspaco } from '../../projetos/banco/obterEspaco.js';
import { gravarPropostas } from '../banco/gravarPropostas.js';
import { lerPropostas } from '../banco/lerPropostas.js';
import { validarDadosDaProposta } from './validarDadosDaProposta.js';
import { MAX_IA_POR_HORA, MAX_PROPOSTAS, NovaProposta, Proposta, propostaSchema } from '../tipos/proposta.js';

/** Mede de 0 a 1 o quanto dois conjuntos de palavras se parecem, para achar propostas repetidas. */

const semelhancaEntrePalavras = (primeiro: Set<string>, segundo: Set<string>): number => {
  if (!primeiro.size || !segundo.size) return 0;
  let emComum = 0;
  for (const palavra of primeiro) {
    if (segundo.has(palavra)) emComum++;
  }
  return emComum / (primeiro.size + segundo.size - emComum);
};

/** Simplifica um texto (minúsculas, sem acentos e sem pontuação) para comparar propostas. */

const textoComparavel = (texto: string): string => texto
  .toLowerCase()
  .normalize('NFD')
  .replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9 ]+/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

/** Usada somente na busca de propostas semelhantes. */
const palavrasDoTexto = (texto: string): Set<string> =>
  new Set(textoComparavel(texto).split(' ').filter(palavra => palavra.length > 2));

export function criarProposta(n: NovaProposta, b?: string, agora = new Date()): Proposta {
  obterEspaco(n.espacoId, b);

  const dados = validarDadosDaProposta(n.tipo, n.dados) as Record<string, unknown>;
  const titulo = mascarar(
    String(n.tipo === 'caso'
      ? (dados as { titulo: string }).titulo
      : (dados as { resumo: string }).resumo)
  ).slice(0, 255);

  const registro = lerPropostas(b);
  const doEspaco = registro.itens.filter(
    proposta => proposta.espacoId === n.espacoId && proposta.estado !== 'DESCARTADA'
  );

  if (doEspaco.length >= MAX_PROPOSTAS) {
    throw new Error('PROPOSAL_LIMIT');
  }

  const propostasRecentesDaIa = doEspaco.filter(
    proposta => proposta.origem === 'IA' && agora.getTime() - Date.parse(proposta.criadaEm) < 3600000
  );
  if (n.origem === 'IA' && propostasRecentesDaIa.length >= MAX_IA_POR_HORA) {
    throw new Error('PROPOSAL_RATE_LIMIT: limite de propostas por hora atingido; revise as pendentes antes de propor mais.');
  }

  const tituloComparavel = textoComparavel(titulo);
  const tituloRepetido = doEspaco.find(
    proposta => proposta.tipo === n.tipo && textoComparavel(proposta.titulo) === tituloComparavel
  );
  if (tituloRepetido) {
    throw new Error('DUPLICATE_PROPOSAL: já existe uma proposta com o mesmo título neste projeto.');
  }

  const palavras = palavrasDoTexto(titulo);
  const similares = doEspaco
    .filter(proposta =>
      proposta.tipo === n.tipo &&
      semelhancaEntrePalavras(palavras, palavrasDoTexto(proposta.titulo)) >= 0.7
    )
    .map(proposta => proposta.id)
    .slice(0, 10);

  const proposta: Proposta = propostaSchema.parse({
    id: randomUUID(),
    espacoId: n.espacoId,
    tipo: n.tipo,
    origem: n.origem,
    ...(n.cliente ? { cliente: n.cliente.slice(0, 60) } : {}),
    estado: 'RASCUNHO',
    titulo,
    dados,
    requisito: mascarar(n.requisito ?? '').slice(0, 500),
    risco: mascarar(n.risco ?? '').slice(0, 300),
    similares,
    revisao: null,
    remoto: null,
    ...(n.falhaDeOrigem ? { falhaDeOrigem: n.falhaDeOrigem } : {}),
    criadaEm: agora.toISOString(),
    atualizadaEm: agora.toISOString()
  });

  registro.itens.push(proposta);
  gravarPropostas(registro, b);
  return proposta;
}
