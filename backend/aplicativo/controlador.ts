/** Controlador da funcionalidade aplicativo: atende canais IPC e delega ao serviço responsável, sem alterar validação nem permissões. */
import { app } from "electron";
import { TratadorDoCanal } from "./api/TratadorDoCanal.js";
import { versaoExibida } from "./tipos/aplicativo.js";
import { diretorioDados } from "../compartilhado/banco/diretorioDados.js";

export const appInfo: TratadorDoCanal<'app:info'> = () => ({ version: versaoExibida, dataDir: diretorioDados(), platform: process.platform, packaged: app.isPackaged });
