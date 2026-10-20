/** Controlador da funcionalidade login: atende canais IPC e delega ao serviço responsável, sem alterar validação nem permissões. */
import { cadastrarConta, confirmarEntrada, alterarMinhasDuasEtapas, entrarNaConta, alterarMeuNome, recuperarConta, reenviarCodigoDeEntrada, sairDaConta, trocarMinhaSenha } from "./regras/contas.js";
import { cadastrarRemotamente, usarAutenticacaoRemota, pedirRecuperacaoRemota, entrarRemotamente, sairRemotamente } from "./integracoes/autenticacaoRemota.js";
import { TratadorDoCanal } from "../aplicativo/api/TratadorDoCanal.js";
import { pedirCodigo } from "./regras/codigosPorEmail.js";
import { entrarComIdentidadeRemota } from "./regras/entradaPorProvedor.js";
import { estadoDaEntrada, iniciarEntrada } from "./regras/entradaPorProvedor.js";
import { dependenciasDoGithub, dependenciasDoGoogle } from "./regras/configuracaoDoLogin.js";
import { workerDoAplicativo } from "../agendamentos/worker/workerDoAplicativo.js";
import { servicosDoAplicativo } from "../conexoes/regras/nucleoServicos.js";
import { revogarCredencialMcp } from "../aplicativo/ponteDaSessaoMcp.js";

export const contaCadastrar: TratadorDoCanal<'conta:cadastrar'> = a =>
  usarAutenticacaoRemota()?cadastrarRemotamente(a.nome,a.email,a.senha):cadastrarConta({...a,codigo:a.codigo??''});

export const contaCodigo:TratadorDoCanal<'conta:codigo'>=async a=>{
  if(usarAutenticacaoRemota()){
    if(a.finalidade!=='SENHA')throw new Error('LOGIN_METHOD_DISABLED');
    return pedirRecuperacaoRemota(a.email);
  }
  if(process.env.PRUMO_LOGIN_MVP === '1')throw new Error('IDENTITY_NOT_CONFIGURED');
  return pedirCodigo(a);
};

export const contaConfirmarentrada:TratadorDoCanal<'conta:confirmarentrada'>=async a=>{
  if(process.env.PRUMO_LOGIN_MVP === '1' || usarAutenticacaoRemota())throw new Error('LOGIN_METHOD_DISABLED');
  return confirmarEntrada(a);
};

export const contaDuasetapas: TratadorDoCanal<'conta:duasetapas'> = a => alterarMinhasDuasEtapas(a);

export const contaGithubestado: TratadorDoCanal<'conta:githubestado'> = a => estadoDaEntrada(a.cancelar);

export const contaGithubiniciar: TratadorDoCanal<'conta:githubiniciar'> = a => iniciarEntrada('github', dependenciasDoGithub(), a.ativar ? 'ativar' : 'entrar');

export const contaGoogleestado: TratadorDoCanal<'conta:googleestado'> = a => estadoDaEntrada(a.cancelar);

export const contaGoogleiniciar: TratadorDoCanal<'conta:googleiniciar'> = a => iniciarEntrada('google', dependenciasDoGoogle(), a.ativar ? 'ativar' : 'entrar');

export const contaPerfil: TratadorDoCanal<'conta:perfil'> = a => alterarMeuNome(a.nome);

export const contaRecuperar: TratadorDoCanal<'conta:recuperar'> = a => recuperarConta(a);

export const contaReenviarentrada: TratadorDoCanal<'conta:reenviarentrada'> = a => reenviarCodigoDeEntrada(a);

export const contaSair: TratadorDoCanal<'conta:sair'> = async () => {
  revogarCredencialMcp(); // O MCP perde acesso antes das operações assíncronas de saída.
  // Encerra tarefas da conta anterior antes de liberar uma nova identidade nesta janela.
  try { await workerDoAplicativo.parar(); } catch { /* Saída não deve preservar sessão por erro do worker. */ }
  await sairRemotamente();
  servicosDoAplicativo.limparPrevias();
  return sairDaConta();
};

export const contaSenha: TratadorDoCanal<'conta:senha'> = a => trocarMinhaSenha(a);
