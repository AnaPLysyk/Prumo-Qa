/** Configuração do login por GitHub e Google neste computador: Client ID em acessos.json, segredo só no cofre do sistema, e as ligações reais de cada fluxo. */
import { BrowserWindow, safeStorage, shell } from 'electron';
import { cofreCredenciais } from '../../conexoes/banco/credenciais.js';
import { protetorDoSistema } from '../../conexoes/regras/protetorDoSistema.js';
import { lerPerfilDoGithub, trocarCodigoNoGithub } from '../integracoes/githubOauth.js';
import { lerPerfilDoGoogle, trocarCodigoNoGoogle } from '../integracoes/googleOauth.js';
import { gravarContas } from '../banco/contas.js';
import { lerContas } from '../banco/contas.js';
import { DependenciasDeEntrada, Provedor } from './entradaPorProvedor.js';

/** Ids fixos das credenciais dos segredos no cofre (o cofre exige um UUID). */
const ID_DO_SEGREDO = { github: '5e9d6f0c-6c3a-4f0e-9a52-0b1a7d2c4e11', google: '7b1c3d52-0e64-4a8b-8f19-2c5d9e6a4f03' } as const;
const PARTES = {
  github: { nome: 'GitHub', campo: 'githubClientId', ambiente: 'GITHUB', formato: /^[A-Za-z0-9._-]{10,60}$/, abrir: 'https://github.com/login/oauth/authorize?' },
  google: { nome: 'Google', campo: 'googleClientId', ambiente: 'GOOGLE', formato: /^[A-Za-z0-9._-]{10,120}$/, abrir: 'https://accounts.google.com/o/oauth2/v2/auth?' }
} as const;
const cofre = () => cofreCredenciais(protetorDoSistema(safeStorage));

/** Client ID e segredo do OAuth App. Variáveis PRUMO_<PROVEDOR>_CLIENT_ID e _CLIENT_SECRET valem quando nada foi salvo pela Administração. */
export function configuracaoDoProvedor(provedor: Provedor, b?: string): { clientId: string; clientSecret: string } | null {
  const p = PARTES[provedor];
  const clientId = lerContas(b).acesso[p.campo] ?? process.env['PRUMO_' + p.ambiente + '_CLIENT_ID'] ?? '';
  let clientSecret = ''; try { clientSecret = cofre().ler(ID_DO_SEGREDO[provedor]); } catch { clientSecret = process.env['PRUMO_' + p.ambiente + '_CLIENT_SECRET'] ?? ''; }
  return p.formato.test(clientId) && clientSecret ? { clientId, clientSecret } : null;
}

/** Salva (ou, com Client ID vazio, apaga) a configuração. O segredo nunca volta para a janela nem vai para acessos.json. */
export function salvarEntradaDoProvedor(provedor: Provedor, d: { clientId: string; clientSecret: string }, b?: string): { configurado: boolean; clientId: string | null } {
  const p = PARTES[provedor]; const sigla = p.ambiente; const clientId = d.clientId.trim(); const r = lerContas(b);
  if (!clientId) { try { cofre().remover(ID_DO_SEGREDO[provedor]); } catch { /* já não existia */ } r.acesso[p.campo] = null; gravarContas(r, b); return { configurado: false, clientId: null }; }
  if (!p.formato.test(clientId)) throw new Error(sigla + '_CLIENT_INVALID: o Client ID do ' + p.nome + ' não tem o formato esperado.');
  if (!d.clientSecret) { let existe = false; try { existe = !!cofre().ler(ID_DO_SEGREDO[provedor]); } catch { existe = false; } if (!existe) throw new Error(sigla + '_SECRET_REQUIRED: informe o Client Secret do ' + p.nome + '.'); }
  else { if (!protetorDoSistema(safeStorage).disponivel()) throw new Error('CREDENTIAL_PROTECTION_UNAVAILABLE'); cofre().salvar(ID_DO_SEGREDO[provedor], d.clientSecret); }
  r.acesso[p.campo] = clientId; gravarContas(r, b); return { configurado: true, clientId };
}

/** Ao voltar do navegador, o Prumo sobe para a frente: a pessoa não precisa procurar a janela. */
const trazerJanelaParaFrente = () => { const j = BrowserWindow.getAllWindows()[0]; if (!j) return; if (j.isMinimized()) j.restore(); j.show(); j.focus(); };
const abrirSoNoProvedor = (provedor: Provedor) => async (url: string) => { if (!url.startsWith(PARTES[provedor].abrir)) throw new Error(PARTES[provedor].ambiente + '_LOGIN_FAILED: endereço recusado.'); await shell.openExternal(url); };

/** Ligações reais com o GitHub: perfil, conexão do GitHub na tela Conexões e o navegador padrão. */
export const dependenciasDoGithub = (): DependenciasDeEntrada => ({
  configuracao: () => configuracaoDoProvedor('github'), trocarCodigo: trocarCodigoNoGithub, lerPerfil: lerPerfilDoGithub,
  abrirNavegador: abrirSoNoProvedor('github'), aoTerminar: trazerJanelaParaFrente
});

/** Ligações reais com o Google: só login (o Google não é um serviço do Prumo, então não há conexão para criar). */
export const dependenciasDoGoogle = (): DependenciasDeEntrada => ({
  configuracao: () => configuracaoDoProvedor('google'), trocarCodigo: trocarCodigoNoGoogle, lerPerfil: lerPerfilDoGoogle,
  abrirNavegador: abrirSoNoProvedor('google'), aoTerminar: trazerJanelaParaFrente
});
