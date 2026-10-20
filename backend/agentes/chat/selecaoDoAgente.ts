/** Seleção de agente e Skill adequada à pergunta, respeitando políticas e preferências. */
import { matrizDePoliticas } from '../politicas/avaliarCapacidades.js';
import { agentesChat } from '../tipos/persona.js';
import { especializacoes } from '../tipos/politicas.js';
import { regrasDosAgentes } from '../../administracao/servico.js';
import { palavrasDaPergunta, termoCasaComPergunta } from './roteamentoDePerguntas.js';
import { SEGUIMENTO, Turno } from '../tipos/chat.js';
import { semAcentos } from '../../compartilhado/texto.js';
import { listarTrechosDeSkill } from '../banco/listarTrechosDeSkill.js';
import { sementeDasSkills } from '../banco/sementeDasSkills.js';
import { SkillEscolhida, escolherTrechosDaSkill } from '../regras/escolherTrechosDaSkill.js';
import { validarEspecializacao } from '../regras/validarEspecializacao.js';
import { falharCom } from '../../compartilhado/erros.js';

/** Apresenta na interface somente agentes habilitados e capacidades efetivas do projeto. */
export function agentesDoChat(espacoId: string | null, base?: string) {
  const matriz = espacoId ? matrizDePoliticas(espacoId, base) : [];
  const desligados = regrasDosAgentes(base).desligados;

  return agentesChat
    .filter(agente => agente.id === 'orquestrador' || !desligados.includes(agente.id))
    .map(agente => {
      const especializacao = agente.especializacao
        ? especializacoes.find(item => item.id === agente.especializacao)
        : null;

      return {
        id: agente.id,
        nome: agente.nome,
        dominio: agente.dominio,
        profissao: agente.profissao,
        especialidade: agente.especialidade,
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
    const pontosVocabulário = agente.palavras.reduce((soma, termo) => {
      const forte = termo.startsWith('!');
      const palavra = forte ? termo.slice(1) : termo;
      if (!termoCasaComPergunta(palavra, palavras, frase)) return soma;

      const peso = forte ? 3 : palavra.replace('~', '').length > 5 ? 2 : 1;
      return soma + peso;
    }, 0);

    const mencionouAgente = texto.includes('@' + agente.id) ||
      texto.includes('agente ' + semAcentos(agente.nome)) ||
      (agente.nome.includes(' ') && texto.includes(semAcentos(agente.nome)));

    const pontos = pontosVocabulário +
      (mencionouAgente ? 10 : 0) +
      Math.min(6, extras.aprendidos?.[agente.id] ?? 0);

    return { agente: agente.id, pontos };
  }).sort((a, b) => b.pontos - a.pontos);

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
    rota: rota.filter(item => item.pontos > 0).slice(0, 4),
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
