/** Canal preferencias:salvar: Alterar verificar ao iniciar, som, silenciar, tema, idioma, iniciar com o Windows e avisos de agenda. */
import { app } from 'electron';
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';
import { alterarPreferencias } from '../regras/alterarPreferencias.js';

export const preferenciasSalvar: TratadorDoCanal<'preferencias:salvar'> = a => {
  const preferencias = alterarPreferencias(a);
  // Iniciar com o Windows só existe se a pessoa ligar explicitamente; desligar remove o registro.
  if (a.iniciarComWindows !== undefined && app.isPackaged) app.setLoginItemSettings({ openAtLogin: preferencias.iniciarComWindows, args: preferencias.iniciarComWindows ? ['--oculto'] : [] });
  return { preferencias };
};
