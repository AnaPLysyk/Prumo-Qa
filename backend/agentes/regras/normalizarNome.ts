/** Arruma o nome dito pela pessoa (iniciais maiúsculas), recusando textos que não parecem nome. */
import { nomeValido } from '../tipos/conhecimento.js';

export function normalizarNome(bruto: string): string | null {
  const n = bruto.replace(/[.!?,;:]+$/g, '').replace(/\s+/g, ' ').trim(); if (!nomeValido.test(n)) return null;
  return n.split(' ').map((p) => (p.length > 2 ? p[0]!.toLocaleUpperCase('pt-BR') + p.slice(1) : p)).join(' ');
}
