/** Canal perfil:salvar: Salvar como a pessoa quer ser chamada e o papel dela (QA, dev, PO, analista ou outro). */
import { salvarPerfil } from '../banco/salvarPerfil.js';
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';

export const perfilSalvar: TratadorDoCanal<'perfil:salvar'> = a => salvarPerfil({ ...(a.comoChamar !== undefined ? { comoChamar: a.comoChamar } : {}), ...(a.papel !== undefined ? { papel: a.papel } : {}) });
