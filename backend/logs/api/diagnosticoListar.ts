/** Canal diagnostico:listar: Listar o diagnóstico técnico das chamadas da interface. */
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';
import { lerDiagnostico } from '../banco/lerDiagnostico.js';

export const diagnosticoListar: TratadorDoCanal<'diagnostico:listar'> = () => lerDiagnostico();
