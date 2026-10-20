/** Monta o menu da bandeja do Windows. */
import { Menu } from 'electron';
import { workerDoAplicativo } from '../../agendamentos/worker/workerDoAplicativo.js';
import { acaoDoMenuDaBandeja } from './acaoDoMenuDaBandeja.js';
import { itensDoMenuDaBandeja } from './itensDoMenuDaBandeja.js';
import { idiomaAtual } from '../../configuracoes/regras/idiomaAtual.js';

export const menuDaBandeja = (atualizar: () => void) => {
  const itens = itensDoMenuDaBandeja(workerDoAplicativo.estado(), idiomaAtual());
  return Menu.buildFromTemplate(itens.map(item => {
    if (item.id === 'separador') return { type: 'separator' as const };
    return { label: item.rotulo, click: () => acaoDoMenuDaBandeja(item.id, atualizar) };
  }));
};
