/** Lista das operações de escrita no Qase que o Prumo conhece. */
import { DefOperacao } from '../../conexoes/tipos/operacao.js';
import { associarTicketAoCasoNoQase } from './associarTicketAoCasoNoQase.js';
import { criarCasoNoQase } from './criarCasoNoQase.js';
import { criarPlanoNoQase } from './criarPlanoNoQase.js';
import { criarRunNoQaseOperacao } from './criarRunNoQaseOperacao.js';
import { criarSuiteNoQase } from './criarSuiteNoQase.js';
import { editarCasoNoQase } from './editarCasoNoQase.js';
import { encerrarRunNoQase } from './encerrarRunNoQase.js';
import { enviarAnexoAoQase } from './enviarAnexoAoQase.js';
import { publicarResultadosNoQase } from './publicarResultadosNoQase.js';

export const operacoesQase = [criarSuiteNoQase, criarCasoNoQase, editarCasoNoQase, associarTicketAoCasoNoQase, criarPlanoNoQase, criarRunNoQaseOperacao, encerrarRunNoQase, publicarResultadosNoQase, enviarAnexoAoQase] as unknown as DefOperacao<unknown>[];
