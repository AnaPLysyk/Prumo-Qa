/** Canal ajuda:integracoes: Catálogo técnico das operações IPC e das ferramentas MCP. */
import { catalogo } from '../../aplicativo/api/catalogoDeContratos.js';
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';

export const ajudaIntegracoes: TratadorDoCanal<'ajuda:integracoes'> = () => catalogo();
