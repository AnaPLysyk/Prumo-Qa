/** Canal suporte:exportar: Salvar o relato em um arquivo local (Markdown), sem usar o GitHub. */
import { dialog } from 'electron';
import fs from 'node:fs';
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';
import { prepararRelatoDaJanela } from '../regras/prepararRelatoDaJanela.js';

export const suporteExportar: TratadorDoCanal<'suporte:exportar'> = async (a, janela) => {
  const p = prepararRelatoDaJanela(a);
  if (!p.ok || !('markdown' in p)) throw new Error('SUPPORT_BLOCKED_SECRET: o relato contém algo que parece segredo ou está incompleto; revise antes de exportar.');
  const destino = await dialog.showSaveDialog(janela!, { title: 'Salvar relato', defaultPath: 'prumo-relato.md', filters: [{ name: 'Markdown', extensions: ['md'] }] });
  if (destino.canceled || !destino.filePath) return { exported: false };
  fs.writeFileSync(destino.filePath, p.markdown, { flag: 'w', mode: 0o600 });
  return { exported: true, path: destino.filePath };
};
