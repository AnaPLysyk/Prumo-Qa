/** Nome da capacidade de um script k6 (k6:<caminho>). */
import { ConfigK6 } from '../tipos/k6.js';

export const capacidadeDoK6 = (c: ConfigK6) => ('k6:' + c.script.replaceAll('\\', '/')).slice(0, 80);
