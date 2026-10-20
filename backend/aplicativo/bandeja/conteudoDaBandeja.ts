/** Estado do agendador e textos localizados apresentados na bandeja do Windows. */
import { EstadoWorker, Idioma, Chave, T } from '../tipos/textosDaBandeja.js';

export const textoNoIdioma = (
  chave: Chave,
  idioma: Idioma,
  vars: Record<string, string | number> = {}
) => T[chave][idioma].replace(
  /\{(\w+)\}/g,
  (_, chaveVariavel: string) =>
    vars[chaveVariavel] !== undefined ? String(vars[chaveVariavel]) : '{' + chaveVariavel + '}'
);

/** Exibe o estado real observado pelo worker, com tradução do idioma selecionado. */
export function resumoDoWorker(estado: EstadoWorker, idioma: Idioma) {
  if (!estado.executando) return textoNoIdioma('parado', idioma);
  if (estado.pausado) return textoNoIdioma('pausado', idioma);
  if (estado.emExecucao) return textoNoIdioma('executando', idioma);
  return textoNoIdioma('ativo', idioma, {
    a: estado.rotinasAtivas,
    p: estado.pendentes
  });
}
