/** Faz uma leitura (GET) num serviço externo. */
import { requisitarServico } from './requisitarServico.js';
import { TransporteServico } from '../tipos/transporte.js';

export const lerDoServico:TransporteServico=p=>requisitarServico(p,'GET');
