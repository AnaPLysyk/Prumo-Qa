/** Escolhe a frase de abertura do agente com o nome da pessoa e do assistente. */
import { numeroDoTexto } from './numeroDoTexto.js';
import { personalidades } from '../tipos/persona.js';

export function aberturaDoAgente(agenteId: string, assistente: string, pessoa: string | null, chave: string): string {
  const p = personalidades[agenteId] ?? personalidades.orquestrador!; const modelo = p.aberturas[numeroDoTexto(chave) % p.aberturas.length]!;
  return modelo.replace('{assistente}', assistente).replace('{pessoa}', pessoa ? ', ' + pessoa : '');
}
