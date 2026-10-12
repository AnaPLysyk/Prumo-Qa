/** Canal suporte:abrir: Abrir o formulário oficial de GitHub Issues já preenchido, depois de revisado e confirmado. */
import { dialog, shell } from 'electron';
import { repositorio } from '../../ajuda/tipos/versoes.js';
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';
import { enderecoOficialDoRelato } from '../regras/enderecoOficialDoRelato.js';
import { prepararRelatoDaJanela } from '../regras/prepararRelatoDaJanela.js';

export const suporteAbrir: TratadorDoCanal<'suporte:abrir'> = async (a, janela) => {
  const p = prepararRelatoDaJanela(a);
  if (!p.ok || !('url' in p)) throw new Error('SUPPORT_BLOCKED_SECRET: o relato contém algo que parece segredo ou está incompleto; revise antes de enviar.');
  if (!enderecoOficialDoRelato(p.url)) throw new Error('SUPPORT_URL_FORBIDDEN: endereço não autorizado.');
  const r = await dialog.showMessageBox(janela!, { type: 'warning', title: 'Abrir formulário do GitHub', buttons: ['Cancelar', 'Abrir no navegador'], defaultId: 0, cancelId: 0, noLink: true,
    message: 'Abrir o formulário de issue já preenchido?', detail: `${p.aviso}

Issues do repositório público ${repositorio} são visíveis para qualquer pessoa. Nada é publicado até você enviar no navegador.

Título: ${p.titulo}${p.truncado ? '\nO texto foi encurtado para caber no endereço; confira no formulário.' : ''}` });
  if (r.response !== 1) return { opened: false };
  await shell.openExternal(p.url); return { opened: true };
};
