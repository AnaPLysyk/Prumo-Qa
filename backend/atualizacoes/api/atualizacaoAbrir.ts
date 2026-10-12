/** Canal atualizacao:abrir: Abrir no navegador a página oficial da release encontrada. */
import { dialog, shell } from 'electron';
import { repositorio } from '../../ajuda/tipos/versao.js';
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';
import { estadoDoAplicativo } from '../../aplicativo/estadoDoAplicativo.js';

export const atualizacaoAbrir: TratadorDoCanal<'atualizacao:abrir'> = async (_a, janela) => {
  if (!estadoDoAplicativo.ultimaRelease || !new RegExp(`^https://github\\.com/${repositorio}/releases/tag/v\\d+\\.\\d+\\.\\d+$`).test(estadoDoAplicativo.ultimaRelease)) throw new Error('NO_VERIFIED_RELEASE: verifique as atualizações antes.');
  const r = await dialog.showMessageBox(janela!, { type: 'question', title: 'Abrir página oficial', buttons: ['Cancelar', 'Abrir no navegador'], defaultId: 0, cancelId: 0, noLink: true,
    message: 'Abrir a página oficial da nova versão?', detail: `${estadoDoAplicativo.ultimaRelease}\n\nO Prumo não baixa nem instala nada. Confira o SHA-256 informado na página antes de executar o instalador.` });
  if (r.response !== 1) return { opened: false };
  await shell.openExternal(estadoDoAplicativo.ultimaRelease); return { opened: true };
};
