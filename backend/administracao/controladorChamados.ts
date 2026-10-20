/** Controlador da funcionalidade administracao: atende canais IPC e delega ao serviço responsável, sem alterar validação nem permissões. */
import { safeStorage } from "electron";
import { TratadorDoCanal } from "../aplicativo/api/TratadorDoCanal.js";
import { protetorDoSistema } from "../conexoes/regras/protetorDoSistema.js";
import { chamadosDaAdministracao, salvarChaveDeAdministracao, lerChaveDeAdministracao } from "../suporte/regras/chamadosDaAdministracao.js";
import { ENDERECO_DO_SERVICO } from "../compartilhado/servicoRemoto.js";

export const chamadosAnexo: TratadorDoCanal<'chamados:anexo'> = (a) => chamadosDaAdministracao.anexo(a.numero, a.indice, { protetor: protetorDoSistema(safeStorage) });

export const chamadosChave: TratadorDoCanal<'chamados:chave'> = (a) => salvarChaveDeAdministracao(a.chave, protetorDoSistema(safeStorage));

export const chamadosConfiguracao: TratadorDoCanal<'chamados:configuracao'> = () => ({ configurada: !!lerChaveDeAdministracao(protetorDoSistema(safeStorage)), servico: new URL(process.env.PRUMO_SERVICO || ENDERECO_DO_SERVICO).origin });

export const chamadosDetalhe: TratadorDoCanal<'chamados:detalhe'> = (a) => chamadosDaAdministracao.detalhe(a.numero, { protetor: protetorDoSistema(safeStorage) });

export const chamadosEstado: TratadorDoCanal<'chamados:estado'> = (a) => chamadosDaAdministracao.mudarEstado(a.numero, a.estado, { protetor: protetorDoSistema(safeStorage) });

export const chamadosListar: TratadorDoCanal<'chamados:listar'> = (a) => chamadosDaAdministracao.listar(a.estado, { protetor: protetorDoSistema(safeStorage) });

export const chamadosResponder: TratadorDoCanal<'chamados:responder'> = (a) => chamadosDaAdministracao.responder(a.numero, a.texto, { protetor: protetorDoSistema(safeStorage) });
