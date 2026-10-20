/** Lista das operações de escrita no Qase que o Prumo conhece. */
import { DefOperacao } from '../../conexoes/tipos/operacao.js';
import { associarTicketAoCasoNoQase } from './vinculosComTickets.js';
import { criarDefeitoNoQase } from './defeitosQase.js';
import { mudarStatusDefeitoNoQase } from './defeitosQase.js';
import { criarCasoNoQase } from './casosQase.js';
import { criarPlanoNoQase } from './criarPlanoNoQase.js';
import { criarRunNoQaseOperacao } from './execucoesQase.js';
import { criarSuiteNoQase } from './casosQase.js';
import { editarCasoNoQase } from './casosQase.js';
import { encerrarRunNoQase } from './execucoesQase.js';
import { enviarAnexoAoQase } from './enviarAnexoAoQase.js';
import { publicarResultadosNoQase } from './execucoesQase.js';

export const operacoesQase = [criarSuiteNoQase, criarDefeitoNoQase, mudarStatusDefeitoNoQase, criarCasoNoQase, editarCasoNoQase, associarTicketAoCasoNoQase, criarPlanoNoQase, criarRunNoQaseOperacao, encerrarRunNoQase, publicarResultadosNoQase, enviarAnexoAoQase] as unknown as DefOperacao<unknown>[];
