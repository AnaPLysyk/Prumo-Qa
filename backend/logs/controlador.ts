/** Controlador da funcionalidade logs: atende canais IPC e delega ao serviço responsável, sem alterar validação nem permissões. */
import { TratadorDoCanal } from "../aplicativo/api/TratadorDoCanal.js";
import { lerDiagnostico } from "./banco/diagnostico.js";
import { dialog } from "electron";
import fs from "node:fs";
import { exportarLogs } from "./regras/consultasDoDiario.js";
import { listarHistoricoDoProjeto } from "./regras/consultasDoDiario.js";
import { listarLogsDoProjeto } from "./regras/consultasDoDiario.js";

export const diagnosticoListar: TratadorDoCanal<'diagnostico:listar'> = () => lerDiagnostico();

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

export const projetoHistorico: TratadorDoCanal<'projeto:historico'> = a => listarHistoricoDoProjeto(a.root, a.filter);

export const projetoLogs: TratadorDoCanal<'projeto:logs'> = a => listarLogsDoProjeto(a.root, a.filter);
