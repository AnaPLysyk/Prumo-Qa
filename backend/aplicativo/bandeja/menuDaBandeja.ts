/** Monta o menu da bandeja do Windows. */
import { Menu } from 'electron';
import { workerDoAplicativo } from '../../agendamentos/worker/workerDoAplicativo.js';
import { acaoDoMenuDaBandeja } from './acaoDoMenuDaBandeja.js';
import { itensDoMenuDaBandeja } from './itensDoMenuDaBandeja.js';
import { idiomaAtual } from '../../configuracoes/regras/idiomaAtual.js';

export const menuDaBandeja = () => Menu.buildFromTemplate(itensDoMenuDaBandeja(workerDoAplicativo.estado(), idiomaAtual()).map(x => (x.id === 'separador' ? { type: 'separator' as const } : { label: x.rotulo, click: () => acaoDoMenuDaBandeja(x.id) })));
