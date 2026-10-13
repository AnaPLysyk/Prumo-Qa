/** Divide um arquivo SKILL.md em trechos curtos (descrição, seções e parágrafos), sem cortar blocos de código. */
import { ParteDaSkill, limitesSkills } from '../tipos/skills.js';

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
