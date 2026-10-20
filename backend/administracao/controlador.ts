/** Controlador da funcionalidade administracao: atende canais IPC e delega ao serviço responsável, sem alterar validação nem permissões. */
import { lerCodigoDoAplicativo } from "./banco/lerCodigoDoAplicativo.js";
import { TratadorDoCanal } from "../aplicativo/api/TratadorDoCanal.js";
import { lerMapaDoAplicativo } from "./banco/lerMapaDoAplicativo.js";
import { agentesDaPlataformaParaJanela, salvarAgentesDaPlataforma } from "./regras/agentesDaPlataforma.js";

export const administracaoCodigo: TratadorDoCanal<'administracao:codigo'> = a => lerCodigoDoAplicativo(a.caminho);

export const administracaoMapa: TratadorDoCanal<'administracao:mapa'> = () => lerMapaDoAplicativo();

export const plataformaAgentes: TratadorDoCanal<'plataforma:agentes'> = () => agentesDaPlataformaParaJanela();

export const plataformaSalvar: TratadorDoCanal<'plataforma:salvar'> = a => salvarAgentesDaPlataforma(a);
