/** Canal contextos:conflito: Marcar ou resolver explicitamente um conflito entre contextos. */
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';
import { usuarioDoWindows } from '../../aplicativo/janela/usuarioDoWindows.js';
import { conflitoDeContextoDaPasta } from '../regras/conflitoDeContextoDaPasta.js';

export const contextosConflito: TratadorDoCanal<'contextos:conflito'> = async a => conflitoDeContextoDaPasta(a.root, a.id, usuarioDoWindows(), a.outroId);
