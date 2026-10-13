// Entrada compatível para npm, Render e consumidores anteriores.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { gerarSite } from '../site/gerar.mjs';
export { gerarSite, markdown } from '../site/gerar.mjs';

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))console.log(JSON.stringify(gerarSite(),null,2));
