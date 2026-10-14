/** Canal preferencias:salvar: Alterar verificar ao iniciar, som, silenciar, tema, idioma, iniciar com o sistema e avisos de agenda. */
import { app } from 'electron';
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';
import { alterarPreferencias } from '../regras/alterarPreferencias.js';
import { iniciarComOSistema } from '../regras/iniciarComOSistema.js';

export const preferenciasSalvar: TratadorDoCanal<'preferencias:salvar'> = a => {
  const preferencias = alterarPreferencias(a);
  // Iniciar com o sistema só existe se a pessoa ligar explicitamente; desligar remove o registro (Windows, macOS ou Linux).
  if (a.iniciarComWindows !== undefined && app.isPackaged) iniciarComOSistema(preferencias.iniciarComWindows, app);
  return { preferencias };
};
