/** Prepara o relato de suporte com a versão instalada e, se marcado, o diagnóstico. */
import { versao } from '../../aplicativo/tipos/aplicativo.js';
import { prepararRelato } from './prepararRelato.js';
import { resumoDoDiagnosticoParaRelato } from './resumoDoDiagnosticoParaRelato.js';

export const prepararRelatoDaJanela = (a: Parameters<typeof prepararRelato>[0]) => prepararRelato(a, { versao, diagnostico: (a as { incluirDiagnostico?: boolean }).incluirDiagnostico ? resumoDoDiagnosticoParaRelato() : undefined });
