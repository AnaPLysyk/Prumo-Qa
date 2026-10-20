/** Controlador da funcionalidade aplicativo: atende canais IPC e delega ao serviço responsável, sem alterar validação nem permissões. */
import { app } from "electron";
import { TratadorDoCanal } from "./api/TratadorDoCanal.js";
import { versao } from "./tipos/aplicativo.js";
import { diretorioDados } from "../compartilhado/banco/diretorioDados.js";

export const appInfo: TratadorDoCanal<'app:info'> = () => ({ version: versao, dataDir: diretorioDados(), platform: process.platform, packaged: app.isPackaged });
