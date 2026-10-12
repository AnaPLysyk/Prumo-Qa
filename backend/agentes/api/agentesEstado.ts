/** Canal agentes:estado: Especializações, políticas e propostas de IA do projeto. */
import { configuracaoDoEspaco } from '../politicas/configuracaoDoEspaco.js';
import { matrizDePoliticas } from '../politicas/matrizDePoliticas.js';
import { especializacoes } from '../tipos/politicas.js';
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';
import { listarPropostas } from '../../tickets/banco/listarPropostas.js';

export const agentesEstado: TratadorDoCanal<'agentes:estado'> = a => ({ configuracao: configuracaoDoEspaco(a.espacoId), matriz: matrizDePoliticas(a.espacoId), especializacoes: especializacoes, propostasIA: listarPropostas(a.espacoId).filter(p => p.origem === 'IA').length });
