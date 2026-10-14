/** Canal contextos:salvar: Criar um contexto, editá-lo (nova versão em rascunho) ou substituí-lo por uma versão posterior. */
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';
import { usuarioDoWindows } from '../../aplicativo/janela/usuarioDoWindows.js';
import { salvarContextoDaPasta } from '../regras/salvarContextoDaPasta.js';

export const contextosSalvar: TratadorDoCanal<'contextos:salvar'> = a => salvarContextoDaPasta(a.root, { id: a.id, substituir: a.substituir, dados: a.dados }, usuarioDoWindows());
