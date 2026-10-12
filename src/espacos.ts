/** Mantém os nomes públicos antigos enquanto as ações de Projetos migram para arquivos simples. */
export {servicos, servicoSchema, identidadeRecurso, dadosEspaco, associacaoSchema} from './modulos/projetos/espacos/definicoesEspaco.js';
export type {Servico, Recurso, Espaco} from './modulos/projetos/espacos/definicoesEspaco.js';
export {listarEspacos, obterEspaco, eventoEspaco} from './modulos/projetos/espacos/armazenarEspacos.js';
export {criarEspaco} from './modulos/projetos/espacos/criarProjeto.js';
export {editarEspaco} from './modulos/projetos/espacos/editarProjeto.js';
export {pastaEspaco} from './modulos/projetos/espacos/vincularPastaDoProjeto.js';
export {gravarVinculo} from './modulos/projetos/espacos/vincularServicoAoProjeto.js';
export {removerVinculoServico} from './modulos/projetos/espacos/removerServicoDoProjeto.js';
export {estadoVinculo} from './modulos/projetos/espacos/validarEstadoDoVinculo.js';
export {configurarAceite} from './modulos/projetos/espacos/configurarCampoAceite.js';
export {registrarEscrita} from './modulos/projetos/espacos/registrarEscritaExterna.js';
export {registrarConsulta} from './modulos/projetos/espacos/registrarConsultaExterna.js';
export {servicoDaReferencia, associarEspaco} from './modulos/projetos/espacos/associarReferencias.js';
