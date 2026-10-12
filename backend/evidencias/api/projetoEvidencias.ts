/** Canal projeto:evidencias: Resultados e logs de execuções reais, preservando PASS, FAIL, BLOCKED e NOT_RUN. */
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';
import { listarEvidenciasDoProjeto } from '../regras/listarEvidenciasDoProjeto.js';

export const projetoEvidencias: TratadorDoCanal<'projeto:evidencias'> = a => listarEvidenciasDoProjeto(a.root, a.jobId);
