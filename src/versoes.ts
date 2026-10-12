/** Mantém a entrada original de versões e encaminha cada tarefa ao seu arquivo nomeado. */
export { repositorio, versaoSchema, versoesSchema } from './modulos/ajuda/versoes/definirFormatoVersao.js';
export type { Versao } from './modulos/ajuda/versoes/definirFormatoVersao.js';
export { analisarVersao } from './modulos/ajuda/versoes/analisarNumeroVersao.js';
export { compararVersoes } from './modulos/ajuda/versoes/compararNumerosVersao.js';
export { urlRelease } from './modulos/ajuda/versoes/montarLinkRelease.js';
export { carregarVersoes } from './modulos/ajuda/versoes/carregarHistoricoVersoes.js';
export { validarVersoes } from './modulos/ajuda/versoes/validarHistoricoVersoes.js';
export { conferirInstalada } from './modulos/ajuda/versoes/conferirVersaoInstalada.js';
export { apresentarVersoes } from './modulos/ajuda/versoes/mostrarHistoricoVersoes.js';
export { notasDaVersao } from './modulos/ajuda/versoes/gerarNotasDeRelease.js';
