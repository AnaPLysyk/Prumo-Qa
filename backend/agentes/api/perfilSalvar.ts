/** Canal perfil:salvar: Salvar o perfil da pessoa (como chamar, papel, experiência, foco e se pode ir para a IA externa). */
import { salvarPerfil } from '../banco/salvarPerfil.js';
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';

export const perfilSalvar: TratadorDoCanal<'perfil:salvar'> = a => salvarPerfil({
  ...(a.comoChamar !== undefined ? { comoChamar: a.comoChamar } : {}), ...(a.papel !== undefined ? { papel: a.papel } : {}),
  ...(a.experiencia !== undefined ? { experiencia: a.experiencia } : {}), ...(a.foco !== undefined ? { foco: a.foco } : {}), ...(a.compartilharComIa !== undefined ? { compartilharComIa: a.compartilharComIa } : {}) });
