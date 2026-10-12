/** Diz se um caminho aponta para algo que nunca deve ser lido: senhas, chaves, .env, .git, node_modules, builds. */
import { negados } from '../tipos/projeto.js';

export function sensivel(p: string) { return p.split(/[\\/]/).some(v => negados.test(v) || /\.(?:pem|key|pfx|p12|crt|sqlite|db)$/i.test(v)); }
