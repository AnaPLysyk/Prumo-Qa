/** Canal site:abrir: Abrir o site institucional oficial no navegador, depois de confirmar. */
import { dialog, shell } from 'electron';
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';

export const siteAbrir: TratadorDoCanal<'site:abrir'> = async (_a, janela) => {
  const url = 'https://prumo-qa-docs.onrender.com/';
  const r = await dialog.showMessageBox(janela!, { type: 'question', title: 'Site institucional', buttons: ['Cancelar', 'Abrir no navegador'], defaultId: 0, cancelId: 0, noLink: true, message: 'Abrir o site institucional do Prumo QA?', detail: url });
  if (r.response !== 1) return { opened: false };
  await shell.openExternal(url); return { opened: true };
};
