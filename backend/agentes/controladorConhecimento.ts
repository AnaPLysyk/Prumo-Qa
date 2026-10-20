/** Controlador da funcionalidade agentes: atende canais IPC e delega ao serviço responsável, sem alterar validação nem permissões. */
import { dialog, shell } from "electron";
import { apagarConhecimento } from "./banco/apagarConhecimento.js";
import { TratadorDoCanal } from "../aplicativo/api/TratadorDoCanal.js";
import { registrarConhecimento } from "./banco/registrarConhecimento.js";
import { decidirConhecimento } from "./repositorioAprendizados.js";
import { esquecerTermo } from "./repositorioAprendizados.js";
import { estadoConhecimento } from "./banco/estadoConhecimento.js";
import { listarConhecimentos } from "./banco/listarConhecimentos.js";
import { caminhoConhecimento } from "./banco/baseDoConhecimento.js";
import { lerPerfil } from "./repositorioPerfil.js";
import { vocabularioDoAgente } from "./repositorioAprendizados.js";

export const conhecimentoApagar: TratadorDoCanal<'conhecimento:apagar'> = async (a, janela) => { const r = await dialog.showMessageBox(janela!, { type: 'warning', buttons: ['Cancelar', 'Apagar'], defaultId: 0, cancelId: 0, title: 'Apagar conhecimento', message: 'Apagar este conhecimento do banco deste computador?', detail: 'Os agentes deixam de usá-lo. O conhecimento inicial do Prumo não pode ser apagado, só descartado.' }); return r.response === 1 ? apagarConhecimento(a.id) : { apagado: false, canceled: true }; };

export const conhecimentoCriar: TratadorDoCanal<'conhecimento:criar'> = a => registrarConhecimento({ espacoId: a.espacoId, agente: a.agente, tipo: a.tipo, titulo: a.titulo, texto: a.texto, origem: 'PESSOA' });

export const conhecimentoDecidir: TratadorDoCanal<'conhecimento:decidir'> = a => decidirConhecimento(a.id, a.estado);

export const conhecimentoEsquecer: TratadorDoCanal<'conhecimento:esquecer'> = a => esquecerTermo(a.agente, a.termo);

export const conhecimentoEstado: TratadorDoCanal<'conhecimento:estado'> = a => estadoConhecimento(a.espacoId);

export const conhecimentoListar: TratadorDoCanal<'conhecimento:listar'> = a => listarConhecimentos({ espacoId: a.espacoId, agente: a.agente ?? null, estados: a.estados, busca: a.busca, somenteDoAgente: a.somenteDoAgente });

export const conhecimentoMostrar: TratadorDoCanal<'conhecimento:mostrar'> = () => { const alvo = caminhoConhecimento(); lerPerfil(); shell.showItemInFolder(alvo); return { arquivo: alvo }; };

export const conhecimentoVocabulario: TratadorDoCanal<'conhecimento:vocabulario'> = a => vocabularioDoAgente(a.agente);
