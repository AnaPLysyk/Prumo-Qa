/** Escolhe os trechos aprovados de uma Skill que vão para o prompt: o essencial sempre, depois os que combinam com a pergunta, até o limite de bytes. */
import { raizDaPalavra } from './raizDaPalavra.js';
import { termosDaFrase } from './termosDaFrase.js';
import { semAcentos } from '../../compartilhado/texto/semAcentos.js';
import { TrechoDeSkill, limitesSkills } from '../tipos/skills.js';

/** Texto pronto para o prompt e quais trechos entraram (para mostrar de onde veio a instrução). */
export type SkillEscolhida = { texto: string; usados: string[]; omitidos: number };

export function escolherTrechosDaSkill(trechos: TrechoDeSkill[], pergunta: string, orcamento: number = limitesSkills.porPrompt): SkillEscolhida {
  const aprovados = trechos.filter((t) => t.estado === 'APROVADO');
  const termos = termosDaFrase(pergunta).map(raizDaPalavra);
  const pontos = (t: TrechoDeSkill) => {
    const titulo = semAcentos(t.titulo); const texto = semAcentos(t.texto);
    const p = termos.reduce((n, k) => n + (titulo.includes(k) ? 2 : 0) + (texto.includes(k) ? 1 : 0), 0);
    return p ? p + (t.origem === 'PESSOA' ? 1 : 0) : 0;
  };
  const essencial = (t: TrechoDeSkill) => t.origem === 'PRUMO' && principal(t) && t.ordem <= 1;
  const fila = [
    ...aprovados.filter(essencial),
    ...aprovados.filter((t) => !essencial(t)).map((t) => ({ t, p: pontos(t) })).filter((x) => x.p > 0).sort((a, b) => b.p - a.p).map((x) => x.t),
    ...aprovados.filter((t) => !essencial(t) && principal(t)).sort((a, b) => a.ordem - b.ordem)
  ];
  const escolhidos: TrechoDeSkill[] = []; let bytes = 0;
  for (const t of fila) {
    if (escolhidos.includes(t)) continue;
    const tamanho = Buffer.byteLength(bloco(t), 'utf8') + 2;
    if (bytes + tamanho > orcamento) continue;
    escolhidos.push(t); bytes += tamanho;
  }
  escolhidos.sort((a, b) => grupo(a) - grupo(b) || (a.fonte ?? '').localeCompare(b.fonte ?? '') || a.ordem - b.ordem);
  return { texto: escolhidos.map(bloco).join('\n\n'), usados: escolhidos.map((t) => t.id), omitidos: aprovados.length - escolhidos.length };
}

/** Trecho do SKILL.md principal (não das referências nem de fora). */
function principal(t: TrechoDeSkill) { return t.origem === 'PRUMO' && (t.fonte ?? '').endsWith('/SKILL.md'); }

/** Ordem de leitura: Skill principal, referências do Prumo, depois o que a equipe escreveu ou importou. */
function grupo(t: TrechoDeSkill) { return principal(t) ? 0 : t.origem === 'PRUMO' ? 1 : t.origem === 'PESSOA' ? 2 : 3; }

/** Como o trecho aparece no prompt, com a origem quando não é do Prumo. */
function bloco(t: TrechoDeSkill) {
  const origem = t.origem === 'PESSOA' ? ' (da equipe)' : t.origem === 'IMPORTADO' ? ` (importado de ${t.fonte ?? 'fonte externa'}${t.licenca ? ', ' + t.licenca : ''})` : t.origem === 'IA' ? ' (sugerido por IA e aprovado)' : '';
  return `## ${t.titulo}${origem}\n${t.texto}`;
}
