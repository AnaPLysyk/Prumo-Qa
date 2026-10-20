/** Controlador da funcionalidade compartilhado: atende canais IPC e delega ao serviço responsável, sem alterar validação nem permissões. */
import { dialog } from "electron";
import fs from "node:fs";
import path from "node:path";
import { TratadorDoCanal } from "../aplicativo/api/TratadorDoCanal.js";

// Exportação restrita das telas aprovadas. O renderer não fornece destino ou
// extensão, e o bloqueio de rede/blob da janela permanece intacto.
export const interfaceExportar: TratadorDoCanal<'interface:exportar'> = async (a, janela) => {
  if (Buffer.byteLength(a.texto, 'utf8') > 2 * 1024 * 1024) throw new Error('EXPORT_FORMAT_INVALID: conteúdo excede 2 MiB');
  const csv = a.tipo === 'metricas-csv'; const ext = csv ? 'csv' : 'json';
  if (!csv) { try { JSON.parse(a.texto); } catch { throw new Error('EXPORT_FORMAT_INVALID'); } }
  const destino = await dialog.showSaveDialog(janela!, { title: 'Exportar ' + (a.tipo === 'agente' ? 'agente' : a.tipo === 'evidencia-json' ? 'evidências' : 'métricas'), defaultPath: 'prumo-' + a.tipo + '.' + ext, filters: [{ name: ext.toUpperCase(), extensions: [ext] }] });
  if (destino.canceled || !destino.filePath) return { exported: false };
  if (path.extname(destino.filePath).toLowerCase() !== '.' + ext) throw new Error('EXPORT_FORMAT_INVALID: escolha um arquivo .' + ext);
  fs.writeFileSync(destino.filePath, a.texto, { flag: 'w', mode: 0o600 });
  return { exported: true, path: destino.filePath };
};
