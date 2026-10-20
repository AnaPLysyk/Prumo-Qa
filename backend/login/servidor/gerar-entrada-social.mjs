/** Atualiza somente o JavaScript estático usado pela página de login do navegador.
 * Rodar no desenvolvimento; Render serve o bundle já revisado no Git.
 */
import {build} from 'esbuild';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';

const entrada=fileURLToPath(new URL('../../../frontend/login/web/entrar-social-fonte.mjs', import.meta.url));
const saida=fileURLToPath(new URL('../../../frontend/login/web/entrar-social.js', import.meta.url));
const shaFonte=createHash('sha256').update(readFileSync(entrada)).digest('hex');
await build({
  entryPoints:[entrada],
  nodePaths:[fileURLToPath(new URL('./node_modules/', import.meta.url))],
  outfile:saida,
  bundle:true,
  banner:{js:`/* PRUMO_LOGIN_SOCIAL_SHA256=${shaFonte} */`},
  minify:true,
  format:'esm',
  target:'es2022',
  platform:'browser',
  sourcemap:false,
  legalComments:'eof',
  logLevel:'warning'
});
console.log('LOGIN_SOCIAL_BUNDLE_OK');
