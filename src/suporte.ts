/** Preserva os nomes públicos de Suporte e encaminha cada ação ao arquivo responsável. */
export { categorias, solicitacaoSchema, AVISO_PUBLICO, urlBase } from './modulos/suporte/definirSolicitacao.js';
export type { Solicitacao, Contexto } from './modulos/suporte/definirSolicitacao.js';
export { revisarPrivacidade } from './modulos/suporte/revisarPrivacidadeRelato.js';
export { montarCorpo } from './modulos/suporte/montarTextoRelato.js';
export { montarUrl, urlOficial, linkDeIssueValido } from './modulos/suporte/gerarLinkGithubRelato.js';
export { prepararSolicitacao } from './modulos/suporte/prepararRelato.js';
