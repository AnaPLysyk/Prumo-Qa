/** Regras das Skills: validar especialização, dividir conteúdo e selecionar trechos pertinentes. */
import { ParteDaSkill, limitesSkills, TrechoDeSkill } from "../tipos/skills.js";
import { raizDaPalavra, termosDaFrase } from "./textosDoConhecimento.js";
import { semAcentos } from "../../compartilhado/texto.js";
import { especializacoes } from "../tipos/politicas.js";
import { falharCom } from "../../compartilhado/erros.js";

/** Parágrafos da mesma seção são juntados até este tamanho; acima dele começa outro trecho. */
const JUNTAR_ATE = 1200;

export function dividirSkillEmTrechos(markdown: string): ParteDaSkill[] {
  let texto = markdown.replace(/\r\n?/g, '\n').replace(/^﻿/, '');
  const partes: ParteDaSkill[] = [];
  const cabecalho = /^---\n([\s\S]*?)\n---\n/.exec(texto);
  if (cabecalho) {
    const descricao = /^description:\s*(.+)$/m.exec(cabecalho[1]!)?.[1]?.trim().replace(/^["']|["']$/g, '');
    if (descricao) partes.push({ titulo: 'Para que serve', texto: descricao, ordem: 0 });
    texto = texto.slice(cabecalho[0].length);
  }
  let secao = 'Introdução'; let atual: string[] = []; let emCodigo = false; let paragrafo: string[] = [];
  const fecharTrecho = () => { const t = atual.join('\n\n').trim(); if (t) partes.push(...emPedacos(secao, t, partes.length)); atual = []; };
  const fecharParagrafo = () => {
    const p = paragrafo.join('\n').trim(); paragrafo = []; if (!p) return;
    if (atual.length && atual.join('\n\n').length + p.length > JUNTAR_ATE) fecharTrecho();
    atual.push(p);
  };
  for (const linha of texto.split('\n')) {
    if (/^\s*```/.test(linha)) emCodigo = !emCodigo;
    const titulo = !emCodigo && /^#{1,6}\s+(.+?)\s*#*\s*$/.exec(linha);
    if (titulo) { fecharParagrafo(); fecharTrecho(); secao = titulo[1]!.slice(0, limitesSkills.titulo); continue; }
    if (!emCodigo && !linha.trim()) { fecharParagrafo(); continue; }
    paragrafo.push(linha);
  }
  fecharParagrafo(); fecharTrecho();
  return partes;
}

/** Um parágrafo maior que o limite vira vários trechos, cortados em fim de frase quando possível. */
function emPedacos(titulo: string, texto: string, ordem: number): ParteDaSkill[] {
  const saida: ParteDaSkill[] = []; let resto = texto;
  while (resto.length > limitesSkills.texto) {
    const corte = Math.max(resto.lastIndexOf('. ', limitesSkills.texto), resto.lastIndexOf('\n', limitesSkills.texto));
    const fim = corte > limitesSkills.texto / 2 ? corte + 1 : limitesSkills.texto;
    saida.push({ titulo, texto: resto.slice(0, fim).trim(), ordem: ordem + saida.length }); resto = resto.slice(fim).trim();
  }
  if (resto) saida.push({ titulo, texto: resto, ordem: ordem + saida.length });
  return saida;
}

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

export function validarEspecializacao(id: string): string {
  if (!especializacoes.some((e) => e.id === id)) falharCom('SKILL_SPECIALIZATION_INVALID');
  return id;
}
