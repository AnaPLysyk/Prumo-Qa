/** Sugere as próximas perguntas úteis conforme o agente, os fatos e o papel da pessoa. */
import { numeroDoFato } from './numeroDoFato.js';
import { termosDaFrase } from '../regras/termosDaFrase.js';
import { Proximo } from '../tipos/chat.js';
import { Papel } from '../tipos/persona.js';
import { semAcentos } from '../../compartilhado/texto/semAcentos.js';

/** Próximos passos calculados dos dados e do papel da pessoa (no lugar de uma frase fixa no fim de toda resposta). */
export function proximosPassosSugeridos(agente: string, fatos: string[], papel: Papel | null, pergunta: string): Proximo[] {
  const lista: Proximo[] = [];
  const por: Record<Papel, Proximo> = { po: { rotulo: 'Riscos para a entrega', pergunta: 'quais os riscos para a entrega?' }, dev: { rotulo: 'O que falhou e onde?', pergunta: 'o que falhou e qual a causa provável?' },
    analista: { rotulo: 'Critério de aceite testável', pergunta: 'como escrever um critério de aceite testável?' }, qa: { rotulo: 'Sessão exploratória', pergunta: 'como montar uma sessão exploratória?' }, outro: { rotulo: 'Situação do projeto', pergunta: 'qual a situação do projeto?' } };
  switch (agente) {
    case 'orquestrador': lista.push({ rotulo: 'O que falhou?', pergunta: 'o que falhou?' }, { rotulo: 'Situação do projeto', pergunta: 'qual a situação do projeto?' }, { rotulo: 'Sessão exploratória', pergunta: 'como montar uma sessão exploratória?' }); break;
    case 'qa-geral': if (numeroDoFato(fatos, 'propostas') > 0) lista.push({ rotulo: 'Revisar propostas', aba: 'testes' }); lista.push({ rotulo: 'Priorizar por risco', pergunta: 'como priorizar os testes por risco?' }, { rotulo: 'Ideias de teste (SFDIPOT)', pergunta: 'quais heurísticas usar para ideias de teste?' }); break;
    case 'requisitos': lista.push({ rotulo: 'Critério de aceite testável', pergunta: 'como escrever um critério de aceite testável?' }, { rotulo: 'Técnicas de teste', pergunta: 'quais técnicas de teste usar para este requisito?' }, { rotulo: 'Abrir Contextos', aba: 'contextos' }); break;
    case 'playwright': lista.push({ rotulo: 'Seletores estáveis', pergunta: 'quais as boas práticas de seletores no playwright?' }, { rotulo: 'Testes mobile', pergunta: 'como testar mobile?' }, { rotulo: 'Ver o código', aba: 'testes' }); break;
    case 'api-rest': lista.push({ rotulo: 'Checklist de API', pergunta: 'qual o checklist de teste de api?' }, { rotulo: 'Ver o código', aba: 'testes' }); break;
    case 'acessibilidade': lista.push({ rotulo: 'Verificação rápida', pergunta: 'como fazer uma verificação rápida de acessibilidade?' }, { rotulo: 'Ver o código', aba: 'testes' }); break;
    case 'investigacao-bugs': if (numeroDoFato(fatos, 'falhas') > 0) lista.push({ rotulo: 'Classificar as falhas', pergunta: 'classifique a causa das últimas falhas' }); lista.push({ rotulo: 'Relato de bug', pergunta: 'como escrever um bom relato de bug?' }, { rotulo: 'Teste instável', pergunta: 'o que fazer com teste flaky?' }); break;
    case 'regressao': if (numeroDoFato(fatos, 'fail') > 0) lista.push({ rotulo: 'O que falhou?', pergunta: 'o que falhou?' }); if (numeroDoFato(fatos, 'rotinas') === 0) lista.push({ rotulo: 'Como agendar?', pergunta: 'como agendar uma rotina?' }); lista.push({ rotulo: 'O que rodar na regressão?', pergunta: 'como escolher o que rodar na regressão?' }); break;
    case 'monitoramento': lista.push({ rotulo: 'Ler as métricas', pergunta: 'como ler as métricas de execução?' }, { rotulo: 'Abrir Histórico', aba: 'historico' }); break;
  }
  if (papel && agente !== 'orquestrador') lista.unshift(por[papel]);
  // Não sugerir o assunto que a pessoa acabou de perguntar (dois termos em comum já bastam).
  const q = semAcentos(pergunta); const tq = new Set(termosDaFrase(pergunta)); const vistos = new Set<string>();
  return lista.filter((x) => { const k = x.pergunta ?? 'aba:' + x.aba; if (vistos.has(k) || (x.pergunta && semAcentos(x.pergunta) === q) || termosDaFrase(x.rotulo + ' ' + (x.pergunta ?? '')).filter((w) => tq.has(w)).length >= 2) return false; vistos.add(k); return true; }).slice(0, 3);
}
