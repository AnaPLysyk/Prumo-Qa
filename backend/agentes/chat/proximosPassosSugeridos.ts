/** Sugere próximos passos úteis conforme o agente, os fatos e o papel da pessoa. */
import { termosDaFrase } from '../regras/normalizacaoDoConhecimento.js';
import { Proximo } from '../tipos/chat.js';
import { Papel } from '../tipos/persona.js';
import { semAcentos } from '../../compartilhado/texto.js';

const sugestaoPorPapel: Record<Papel, Proximo> = {
  po: { rotulo: 'Riscos para a entrega', pergunta: 'quais os riscos para a entrega?' },
  dev: { rotulo: 'O que falhou e onde?', pergunta: 'o que falhou e qual a causa provável?' },
  analista: { rotulo: 'Critério de aceite testável', pergunta: 'como escrever um critério de aceite testável?' },
  qa: { rotulo: 'Sessão exploratória', pergunta: 'como montar uma sessão exploratória?' },
  outro: { rotulo: 'Situação do projeto', pergunta: 'qual a situação do projeto?' }
};

/** Extrai o número de um fato no formato "falhas=3". */
const numeroDoFato = (fatos: string[], chave: string): number =>
  Number(fatos.find(fato => fato.startsWith(chave + '='))?.split('=')[1] ?? NaN);

export function proximosPassosSugeridos(
  agente: string,
  fatos: string[],
  papel: Papel | null,
  pergunta: string
): Proximo[] {
  const sugestoes: Proximo[] = [];

  switch (agente) {
    case 'orquestrador':
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
