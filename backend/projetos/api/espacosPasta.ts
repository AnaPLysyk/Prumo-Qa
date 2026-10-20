/** Canal espacos:pasta: Vincular a pasta de um repositório de código ao projeto Prumo, de qualquer stack. */
import { dialog } from 'electron';
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';
import { confirmarNoWindows } from '../../aplicativo/janela/confirmarNoWindows.js';
import { obterEspaco } from '../banco/obterEspaco.js';
import { vincularPastaDoDisco } from '../regras/vincularPastaDoDisco.js';

// Qualquer pasta de código. Sem qa.project.json, o Prumo detecta a stack e propõe o contrato; só grava depois da
// confirmação nativa. A pasta vem do diálogo do sistema, nunca do renderer. Contrato existente nunca é sobrescrito.
export const espacosPasta: TratadorDoCanal<'espacos:pasta'> = async (a, j) => {
  obterEspaco(a.id); const r = await dialog.showOpenDialog(j!, { title: 'Pasta do repositório ou projeto de código', properties: ['openDirectory'] });
  if (r.canceled || !r.filePaths[0]) return { canceled: true };
  return vincularPastaDoDisco(a.id, r.filePaths[0], (t, m, d, b) => confirmarNoWindows(j, t, m, d, b));
};
