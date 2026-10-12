/** Canal logs:exportar: Exportar o histórico bruto do projeto para um arquivo escolhido pela pessoa. */
import { dialog } from 'electron';
import fs from 'node:fs';
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';
import { exportarLogs } from '../regras/exportarLogs.js';

export const logsExportar: TratadorDoCanal<'logs:exportar'> = async (a, janela) => {
  const aviso = await dialog.showMessageBox(janela!, { type: 'info', title: 'Exportar logs', buttons: ['Cancelar', 'Continuar'], defaultId: 0, cancelId: 0, noLink: true,
    message: 'Os registros podem conter informações relacionadas ao projeto (identificadores, contagens, estados).', detail: 'O arquivo será gravado onde você escolher. O Prumo não envia nada pela rede.' });
  if (aviso.response !== 1) return { exported: false };
  const conteudo = await exportarLogs(a.root);
  const destino = await dialog.showSaveDialog(janela!, { title: 'Salvar logs', defaultPath: 'prumo-logs.json', filters: [{ name: 'JSON', extensions: ['json'] }] });
  if (destino.canceled || !destino.filePath) return { exported: false };
  fs.writeFileSync(destino.filePath, conteudo, { flag: 'w', mode: 0o600 });
  return { exported: true, path: destino.filePath };
};
