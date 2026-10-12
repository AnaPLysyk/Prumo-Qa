/** Preserva a API de preferências enquanto cada função fica na tela correspondente. */
export { iaSchema, iaPadrao, preferenciasSchema, padrao, alteracaoSchema } from './modulos/configuracoes/definirPreferencias.js';
export type { Preferencias } from './modulos/configuracoes/definirPreferencias.js';
export { lerPreferencias } from './modulos/configuracoes/armazenarPreferencias.js';
export { alterarPreferencias } from './modulos/configuracoes/alterarPreferencias.js';
export { autorizarDelegacao } from './modulos/agentes/autorizarDelegacaoIa.js';
export { marcarVisualizada } from './modulos/ajuda/marcarVersaoVisualizada.js';
export { avisoPendente } from './modulos/ajuda/mostrarAvisoVersao.js';
export { registrarConsulta } from './modulos/ajuda/registrarConsultaVersao.js';
