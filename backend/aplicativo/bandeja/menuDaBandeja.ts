/** Monta o menu da bandeja do Windows. */
import { Menu } from 'electron';
import { workerDoAplicativo } from '../../agendamentos/worker/workerDoAplicativo.js';
import { acaoDoMenuDaBandeja } from './acaoDoMenuDaBandeja.js';

import { idiomaAtual } from '../../configuracoes/servico.js';
import { resumoDoWorker } from './conteudoDaBandeja.js';
import { textoNoIdioma } from './conteudoDaBandeja.js';
import { EstadoWorker, Idioma, ItemMenu } from '../tipos/textosDaBandeja.js';

/** Modelo puro do menu da bandeja. Pausar e Retomar nunca aparecem juntos; o item de estado reflete o worker real. */
function itensDoMenuDaBandeja(e: EstadoWorker, i: Idioma): ItemMenu[] {
  return [
    { id: 'abrir', rotulo: textoNoIdioma('abrir', i) }, { id: 'agenda', rotulo: textoNoIdioma('agenda', i) }, { id: 'execucoes', rotulo: textoNoIdioma('execucoes', i) }, { id: 'separador', rotulo: '' },
    e.pausado ? { id: 'retomar', rotulo: textoNoIdioma('retomar', i) } : { id: 'pausar', rotulo: textoNoIdioma('pausar', i) },
    { id: 'estado', rotulo: textoNoIdioma('estado', i, { e: resumoDoWorker(e, i) }) }, { id: 'separador', rotulo: '' }, { id: 'sair', rotulo: textoNoIdioma('sair', i) }
  ];
}


export const menuDaBandeja = (atualizar: () => void) => {
  const itens = itensDoMenuDaBandeja(workerDoAplicativo.estado(), idiomaAtual());
  return Menu.buildFromTemplate(itens.map(item => {
    if (item.id === 'separador') return { type: 'separator' as const };
    return { label: item.rotulo, click: () => acaoDoMenuDaBandeja(item.id, atualizar) };
  }));
};
