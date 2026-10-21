/** Roteamento e próximos passos da conversa — arquivos relacionados agrupados para manutenção. */
import { matrizDePoliticas } from "../servicoPoliticas.js";
import { agentesChat, Papel } from "../tipos/persona.js";
import { especializacoes } from "../tipos/persona.js";
import { regrasDosAgentes } from "../../administracao/servico.js";
import { contaDaSessao } from "../../login/regras/sessao.js";
import { lerPreferenciasDosAgentes } from "../regras/agentesPessoais.js";
import { SEGUIMENTO, Turno, Proximo } from "../tipos/chat.js";
import { semAcentos } from "../../compartilhado/texto.js";
import { listarTrechosDeSkill } from "../banco/skills.js";
import { sementeDasSkills } from "../banco/lerPastaDeSkill.js";
import { SkillEscolhida, escolherTrechosDaSkill, validarEspecializacao } from "../regras/regrasDasSkills.js";
import { falharCom } from "../../compartilhado/erros.js";
import { limitesOrquestracao } from "../tipos/chat.js";
import { termosDaFrase } from "../regras/normalizacaoDoConhecimento.js";

// ── roteamento ──
/** Apresenta na interface somente agentes habilitados e capacidades efetivas do projeto. */
export function agentesDoChat(espacoId: string | null, base?: string) {
  const matriz = espacoId ? matrizDePoliticas(espacoId, base) : [];
  const regras = regrasDosAgentes(base); const desligados = regras.desligados;
  const usuario = contaDaSessao(base); const meus = usuario ? lerPreferenciasDosAgentes(usuario.id, base) : {};

  return agentesChat
    .filter(agente => agente.id === 'orquestrador' || !desligados.includes(agente.id))
    .map(agente => {
      const especializacao = agente.especializacao
        ? especializacoes.find(item => item.id === agente.especializacao)
        : null;

      return {
        id: agente.id,
        nome: meus[agente.id]?.apelido || regras.perfis[agente.id]?.nome || agente.nome,
        dominio: agente.dominio,
        profissao: regras.perfis[agente.id]?.profissao ?? agente.profissao,
        especialidade: regras.perfis[agente.id]?.especialidade ?? agente.especialidade,
        especializacao: agente.especializacao,
        aba: agente.aba,
        // Marcadores internos ! e ~ não são mostrados na interface.
        palavras: agente.palavras.map(palavra => palavra.replace(/^!/, '').replace('~', '')),
        skill: especializacao?.skill ?? null,
        capacidades: (especializacao?.capacidades ?? []).map(capacidade => ({
          id: capacidade,
          estado: matriz.find(item => item.id === capacidade)?.estado ?? null
        }))
      };
    });
}

/**
 * Escolhe pelo vocabulário do agente e pelo aprendizado da pessoa.
 * Menção explícita vale mais que termos simples; perguntas de seguimento podem manter o agente anterior.
 */
export function escolherAgente(
  pergunta: string,
  forcado?: string | null,
  extras: {
    historico?: Turno[];
    aprendidos?: Record<string, number>;
    desligados?: readonly string[];
  } = {}
) {
  const ativos = agentesChat.filter(
    agente => agente.id === 'orquestrador' || !extras.desligados?.includes(agente.id)
  );
  const texto = semAcentos(pergunta);
  const palavras = palavrasDaPergunta(pergunta);
  const frase = palavras.join(' ');

  const rota = ativos.map(agente => {
    // Em empate de pontos, vence quem casou primeiro na pergunta (o assunto vem antes do complemento).
    let primeiraPosicao = Infinity;
    const pontosVocabulário = agente.palavras.reduce((soma, termo) => {
      const forte = termo.startsWith('!');
      const palavra = forte ? termo.slice(1) : termo;
      const posicao = posicaoDoTermo(palavra, palavras, frase);
      if (posicao < 0) return soma;

      primeiraPosicao = Math.min(primeiraPosicao, posicao);
      const peso = forte ? 3 : palavra.replace('~', '').length > 5 ? 2 : 1;
      return soma + peso;
    }, 0);

    const mencionouAgente = texto.includes('@' + agente.id) ||
      texto.includes('agente ' + semAcentos(agente.nome)) ||
      (agente.nome.includes(' ') && texto.includes(semAcentos(agente.nome)));

    const pontos = pontosVocabulário +
      (mencionouAgente ? 10 : 0) +
      Math.min(6, extras.aprendidos?.[agente.id] ?? 0);

    return { agente: agente.id, pontos, primeiraPosicao };
  }).sort((a, b) => b.pontos - a.pontos || a.primeiraPosicao - b.primeiraPosicao);

  const melhor = rota[0]!;
  const ultimo = extras.historico?.at(-1);
  let continuou = false;
  let escolhido = forcado ? ativos.find(agente => agente.id === forcado) : undefined;

  if (
    !escolhido && ultimo && melhor.pontos < 3 &&
    (SEGUIMENTO.test(frase) || (palavras.length <= 3 && melhor.pontos === 0))
  ) {
    escolhido = ativos.find(agente => agente.id === ultimo.agente);
    continuou = !!escolhido;
  }

  escolhido ??= (melhor.pontos > 0
    ? ativos.find(agente => agente.id === melhor.agente)
    : undefined) ?? ativos[0]!;

  return {
    agente: escolhido,
    rota: rota.filter(item => item.pontos > 0).slice(0, 4).map(({ agente, pontos }) => ({ agente, pontos })),
    continuou
  };
}

/**
 * Envia ao prompt somente trechos aprovados. Se o banco falhar, usa as Skills embarcadas.
 * Sem instruções disponíveis, recusa a chamada de IA externa.
 */
export function skillDoAgente(
  especializacao: string | null,
  pergunta: string,
  base?: string
): SkillEscolhida & { origem: 'BANCO' | 'ARQUIVOS' } {
  const id = validarEspecializacao(especializacao ?? 'qa-geral');
  let resultado: SkillEscolhida & { origem: 'BANCO' | 'ARQUIVOS' };

  try {
    const trechos = listarTrechosDeSkill(
      { especializacao: id, estados: ['APROVADO'] }, base
    );
    resultado = { ...escolherTrechosDaSkill(trechos, pergunta), origem: 'BANCO' };
  } catch {
    const embarcados = sementeDasSkills().filter(item => item.especializacao === id);
    resultado = { ...escolherTrechosDaSkill(embarcados, pergunta), origem: 'ARQUIVOS' };
  }

  if (!resultado.texto) {
    falharCom('SKILL_UNAVAILABLE: nenhuma instrução aprovada desta especialização; resposta local.');
  }
  return resultado;
}

export const palavrasDaPergunta = (p: string) => semAcentos(p).split(/[^a-z0-9@]+/).filter(Boolean);

/**
 * Termo simples = palavra inteira (com plural); "~" = início de palavra; com espaço = expressão a partir do início de uma palavra.
 * Termos simples de 10 letras ou mais toleram erro de digitação (até um terço das letras, mesmas 3 letras iniciais).
 * Devolve a posição da primeira palavra que casou, ou -1.
 */
export function posicaoDoTermo(termo: string, palavras: string[], frase: string) {
  if (termo.includes(' ')) {
    const inicio = (' ' + frase).indexOf(' ' + termo);
    return inicio < 0 ? -1 : (' ' + frase).slice(0, inicio).split(' ').length - 1;
  }
  if (termo.endsWith('~')) { const r = termo.slice(0, -1); return palavras.findIndex((w) => w.startsWith(r)); }
  const exata = palavras.findIndex((w) => w === termo || w === termo + 's' || w === termo + 'es');
  if (exata >= 0 || termo.length < 10) return exata;
  return palavras.findIndex((w) => w.length >= 8 && w.slice(0, 3) === termo.slice(0, 3) && distanciaDeEdicao(w, termo) <= Math.floor(termo.length / 3));
}

export const termoCasaComPergunta = (termo: string, palavras: string[], frase: string) => posicaoDoTermo(termo, palavras, frase) >= 0;

/** Distância de Levenshtein entre duas palavras curtas. */
function distanciaDeEdicao(a: string, b: string) {
  let anterior = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const atual = [i];
    for (let j = 1; j <= b.length; j++) atual[j] = Math.min(anterior[j]! + 1, atual[j - 1]! + 1, anterior[j - 1]! + (a[i - 1] === b[j - 1] ? 0 : 1));
    anterior = atual;
  }
  return anterior[b.length]!;
}

/** Devolve os ids dos especialistas, na ordem da pontuação, ou null quando um agente só basta. */
export function planejarOrquestracao(rota: { agente: string; pontos: number }[]): string[] | null {
  const fortes = rota.filter((r) => r.agente !== 'orquestrador' && r.pontos >= limitesOrquestracao.pontosMinimos)
    .sort((a, b) => b.pontos - a.pontos).slice(0, limitesOrquestracao.agentes).map((r) => r.agente);
  return fortes.length >= 2 ? fortes : null;
}

/** Pedidos explícitos de panorama recebem um diagnóstico de três especialidades, não só o agente com mais palavras-chave.
 * Sem projeto ou com especialistas desligados, mantém o roteamento normal. Não executa testes nem usa IA externa.
 */
export function planejarDiagnosticoQa(pergunta: string, espacoId: string | null, desligados: readonly string[] = []): string[] | null {
  if (!espacoId || !/(?:diagnostic|auditori|panorama|saude|check.?up|visao geral|analise geral|(?:analise|analisar) (?:da |do |a |o )?qualidade)/.test(semAcentos(pergunta))) return null;
  if (!/(?:projeto|qualidade|qa|teste|sistema|entrega)/.test(semAcentos(pergunta))) return null;
  const especialistas = ['regressao', 'investigacao-bugs', 'requisitos'].filter(id => !desligados.includes(id));
  return especialistas.length >= 2 ? especialistas.slice(0, limitesOrquestracao.agentes) : null;
}

// ── proximosPassosSugeridos ──
const sugestaoPorPapel: Record<Papel, Proximo> = {
  po: { rotulo: 'Riscos para a entrega', pergunta: 'quais os riscos para a entrega?' },
  dev: { rotulo: 'O que falhou e onde?', pergunta: 'o que falhou e qual a causa provável?' },
  analista: { rotulo: 'Critério de aceite testável', pergunta: 'como escrever um critério de aceite testável?' },
  qa: { rotulo: 'Sessão exploratória', pergunta: 'como montar uma sessão exploratória?' },
  outro: { rotulo: 'Situação do projeto', pergunta: 'qual a situação do projeto?' }
};

/** Extrai o número de um fato no formato "falhas=3". */
const numeroDoFato = (fatos: string[], chave: string): number =>
  Number(fatos.find(fato => fato.split(':').at(-1)?.startsWith(chave + '='))?.split('=').at(-1) ?? NaN);

export function proximosPassosSugeridos(
  agente: string,
  fatos: string[],
  papel: Papel | null,
  pergunta: string
): Proximo[] {
  const sugestoes: Proximo[] = [];

  switch (agente) {
    case 'orquestrador':
      if (numeroDoFato(fatos, 'fail') > 0) sugestoes.push({ rotulo: 'Revisar execuções com falha', aba: 'execucoes' });
      else if (numeroDoFato(fatos, 'execucoes') === 0) sugestoes.push({ rotulo: 'Preparar primeira execução', aba: 'testes' });
      if (numeroDoFato(fatos, 'contextosAprovados') === 0) sugestoes.push({ rotulo: 'Revisar requisitos', aba: 'contextos' });
      if (numeroDoFato(fatos, 'testesCatalogados') === 0 && numeroDoFato(fatos, 'contextosAprovados') > 0) sugestoes.push({ rotulo: 'Propor casos para os requisitos', aba: 'testes' });
      if (numeroDoFato(fatos, 'vinculosAusentes') > 0) sugestoes.push({ rotulo: 'Revisar vínculos de casos', aba: 'testes' });
      sugestoes.push(
        { rotulo: 'O que falhou?', pergunta: 'o que falhou?' },
        { rotulo: 'Situação do projeto', pergunta: 'qual a situação do projeto?' },
        { rotulo: 'Sessão exploratória', pergunta: 'como montar uma sessão exploratória?' }
      );
      break;

    case 'qa-geral':
      if (numeroDoFato(fatos, 'propostas') > 0) {
        sugestoes.push({ rotulo: 'Revisar propostas', aba: 'testes' });
      }
      sugestoes.push(
        { rotulo: 'Priorizar por risco', pergunta: 'como priorizar os testes por risco?' },
        { rotulo: 'Ideias de teste (SFDIPOT)', pergunta: 'quais heurísticas usar para ideias de teste?' }
      );
      break;

    case 'requisitos':
      sugestoes.push(
        { rotulo: 'Critério de aceite testável', pergunta: 'como escrever um critério de aceite testável?' },
        { rotulo: 'Técnicas de teste', pergunta: 'quais técnicas de teste usar para este requisito?' },
        { rotulo: 'Abrir Contextos', aba: 'contextos' }
      );
      break;

    case 'playwright':
      sugestoes.push(
        { rotulo: 'Seletores estáveis', pergunta: 'quais as boas práticas de seletores no playwright?' },
        { rotulo: 'Testes mobile', pergunta: 'como testar mobile?' },
        { rotulo: 'Ver o código', aba: 'testes' }
      );
      break;

    case 'api-rest':
      sugestoes.push(
        { rotulo: 'Checklist de API', pergunta: 'qual o checklist de teste de api?' },
        { rotulo: 'Ver o código', aba: 'testes' }
      );
      break;

    case 'acessibilidade':
      sugestoes.push(
        { rotulo: 'Verificação rápida', pergunta: 'como fazer uma verificação rápida de acessibilidade?' },
        { rotulo: 'Ver o código', aba: 'testes' }
      );
      break;

    case 'investigacao-bugs':
      if (numeroDoFato(fatos, 'falhas') > 0) {
        sugestoes.push({ rotulo: 'Classificar as falhas', pergunta: 'classifique a causa das últimas falhas' });
      }
      sugestoes.push(
        { rotulo: 'Relato de bug', pergunta: 'como escrever um bom relato de bug?' },
        { rotulo: 'Teste instável', pergunta: 'o que fazer com teste flaky?' }
      );
      break;

    case 'regressao':
      if (numeroDoFato(fatos, 'fail') > 0) {
        sugestoes.push({ rotulo: 'O que falhou?', pergunta: 'o que falhou?' });
      }
      if (numeroDoFato(fatos, 'rotinas') === 0) {
        sugestoes.push({ rotulo: 'Como agendar?', pergunta: 'como agendar uma rotina?' });
      }
      sugestoes.push({ rotulo: 'O que rodar na regressão?', pergunta: 'como escolher o que rodar na regressão?' });
      break;

    case 'monitoramento':
      sugestoes.push(
        { rotulo: 'Ler as métricas', pergunta: 'como ler as métricas de execução?' },
        { rotulo: 'Abrir Histórico', aba: 'historico' }
      );
      break;
  }

  if (papel && agente !== 'orquestrador') {
    sugestoes.unshift({ ...sugestaoPorPapel[papel] });
  }

  // Não repetir a pergunta atual nem oferecer duas vezes a mesma ação.
  const perguntaNormalizada = semAcentos(pergunta);
  const termosDaPergunta = new Set(termosDaFrase(pergunta));
  const jaSugeridos = new Set<string>();

  return sugestoes.filter(sugestao => {
    const chave = sugestao.pergunta ?? 'aba:' + sugestao.aba;
    if (jaSugeridos.has(chave)) return false;
    if (sugestao.pergunta && semAcentos(sugestao.pergunta) === perguntaNormalizada) return false;

    const termos = termosDaFrase(sugestao.rotulo + ' ' + (sugestao.pergunta ?? ''));
    if (termos.filter(termo => termosDaPergunta.has(termo)).length >= 2) return false;

    jaSugeridos.add(chave);
    return true;
  }).slice(0, 3);
}
