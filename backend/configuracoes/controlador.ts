/** Controlador da funcionalidade configuracoes: atende canais IPC e delega ao serviço responsável, sem alterar validação nem permissões. */
import { TratadorDoCanal } from "../aplicativo/api/TratadorDoCanal.js";
import { versao } from "../aplicativo/tipos/aplicativo.js";
import { avisoDeVersaoPendente } from "../atualizacoes/servicoVerificacao.js";
import { lerPreferencias } from "./repositorio.js";
import { app } from "electron";
import { alterarPreferencias } from "./servico.js";
import { iniciarComOSistema } from "./servico.js";

export const preferenciasObter: TratadorDoCanal<'preferencias:obter'> = () => ({ preferencias: lerPreferencias(), aviso: avisoDeVersaoPendente(versao), instalada: versao });

export const preferenciasSalvar: TratadorDoCanal<'preferencias:salvar'> = a => {
  const preferencias = alterarPreferencias(a);
  // Iniciar com o sistema só existe se a pessoa ligar explicitamente; desligar remove o registro (Windows, macOS ou Linux).
  if (a.iniciarComWindows !== undefined && app.isPackaged) iniciarComOSistema(preferencias.iniciarComWindows, app);
  return { preferencias };
};
