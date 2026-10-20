/** Login social web do Prumo QA: preserva o PKCE gerado pelo cliente Electron.
 * Os segredos OAuth permanecem no Render. Nenhum cookie ou token é enviado ao app.
 */
import {createAuthClient} from 'better-auth/client';
import {electronProxyClient} from '@better-auth/electron/proxy';

const esquema = 'com.anaplysyk.prumoqa';
const cliente = createAuthClient({
  baseURL: location.origin,
  plugins: [electronProxyClient({protocol: {scheme: esquema}, clientID: 'electron'})]
});
const estado = document.querySelector('#estado');
const botoes = ['github', 'google'].map(id => ({id, botao: document.getElementById(id)}));
const parametros = new URLSearchParams(location.search);
const desafio = parametros.get('code_challenge') || '';
const state = parametros.get('state') || '';
const clientId = parametros.get('client_id') || '';
const pkceValido = clientId === 'electron'
  && /^[A-Za-z0-9_-]{43,128}$/.test(desafio)
  && /^[A-Za-z0-9._~-]{10,512}$/.test(state);

const aviso = texto => { estado.textContent = texto; };
const temporizador = cliente.ensureElectronRedirect();
window.addEventListener('pagehide', () => clearTimeout(temporizador), {once: true});

if (!pkceValido) {
  aviso('Abra o Prumo QA e inicie o acesso pelo aplicativo. Esta página não aceita autenticação avulsa.');
} else {
  const query = {client_id: clientId, state, code_challenge: desafio};
  aviso('Selecione o provedor de identidade para continuar.');
  for (const {id, botao} of botoes) {
    botao.disabled = false;
    botao.addEventListener('click', async () => {
      for (const item of botoes) item.botao.disabled = true;
      aviso('Abrindo a autorização segura…');
      try {
        const resultado = await cliente.signIn.social({provider: id, fetchOptions: {query}});
        if (resultado?.error) throw new Error('PROVIDER_REJECTED');
      } catch {
        aviso('Não foi possível iniciar a autorização. Volte ao aplicativo e tente novamente.');
        for (const item of botoes) item.botao.disabled = false;
      }
    });
  }
}
