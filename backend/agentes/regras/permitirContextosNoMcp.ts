/** Liga ou desliga o envio dos contextos do projeto para a IA conectada por MCP. */
import { gravarPermissaoDeContextosNoMcp } from '../banco/gravarPermissaoDeContextosNoMcp.js';
import { abrirProjetoVinculado } from '../../projetos/regras/abrirProjetoVinculado.js';

export const permitirContextosNoMcp = async (raiz: string, habilitar: boolean) => gravarPermissaoDeContextosNoMcp(await abrirProjetoVinculado(raiz), habilitar);
