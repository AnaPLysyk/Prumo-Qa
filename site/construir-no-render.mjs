// Build do site no Render: traz os instaladores conferidos da release para o próprio site e gera as páginas apontando para eles.
// Se o GitHub não responder ou algum SHA-256 divergir, o site sai com os botões apontando para a release oficial (nunca com link
// quebrado) e o motivo fica no log do build.
import { baixarInstaladores } from './baixar-instalador.mjs';
import { gerarSite } from './gerar.mjs';

try {
  const r = await baixarInstaladores();
  process.env.PRUMO_SITE_HOSPEDA_INSTALADOR = '1';
  console.log(`Instaladores hospedados no site: ${r.instaladores.map((i) => i.arquivo).join(', ')}`);
} catch (e) {
  console.warn(`Instaladores NÃO hospedados neste build (botões apontam para a release do GitHub): ${e.message}`);
}
console.log(JSON.stringify(gerarSite(), null, 2));
