/** Formato da função que atende um canal da janela: recebe os dados já validados pelo contrato e a janela que pediu. */
import type { BrowserWindow } from 'electron';
import type { z } from 'zod';
import type { CanalIpc, esquemasIpc } from './catalogoDeContratos.js';

export type TratadorDoCanal<C extends CanalIpc> = (a: z.output<(typeof esquemasIpc)[C]>, janela: BrowserWindow | null) => unknown;
