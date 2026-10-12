/** Monta os itens do menu da bandeja conforme o estado do worker. */
import { resumoDoWorker } from './resumoDoWorker.js';
import { textoNoIdioma } from './textoNoIdioma.js';
import { EstadoWorker, Idioma, ItemMenu } from '../tipos/textosDaBandeja.js';

/** Modelo puro do menu da bandeja. Pausar e Retomar nunca aparecem juntos; o item de estado reflete o worker real. */
export function itensDoMenuDaBandeja(e: EstadoWorker, i: Idioma): ItemMenu[] {
  return [
    { id: 'abrir', rotulo: textoNoIdioma('abrir', i) }, { id: 'agenda', rotulo: textoNoIdioma('agenda', i) }, { id: 'execucoes', rotulo: textoNoIdioma('execucoes', i) }, { id: 'separador', rotulo: '' },
    e.pausado ? { id: 'retomar', rotulo: textoNoIdioma('retomar', i) } : { id: 'pausar', rotulo: textoNoIdioma('pausar', i) },
    { id: 'estado', rotulo: textoNoIdioma('estado', i, { e: resumoDoWorker(e, i) }) }, { id: 'separador', rotulo: '' }, { id: 'sair', rotulo: textoNoIdioma('sair', i) }
  ];
}
