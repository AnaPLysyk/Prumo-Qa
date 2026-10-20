/** Controlador da funcionalidade administracao: atende canais IPC e delega ao serviço responsável, sem alterar validação nem permissões. */
import { alterarContaPelaAdministracao, criarContaPelaAdministracao, desbloquearConta, excluirConta, listarContasDeAcesso, redefinirSenhaPelaAdministracao } from "./servico.js";
import { TratadorDoCanal } from "../aplicativo/api/TratadorDoCanal.js";
import { ativarLogin } from "../login/regras/contas.js";

export const usuariosAlterar: TratadorDoCanal<'usuarios:alterar'> = a => alterarContaPelaAdministracao(a);

export const usuariosAtivar: TratadorDoCanal<'usuarios:ativar'> = a => ativarLogin(a);

export const usuariosCriar: TratadorDoCanal<'usuarios:criar'> = a => criarContaPelaAdministracao(a);

export const usuariosDesbloquear: TratadorDoCanal<'usuarios:desbloquear'> = a => desbloquearConta(a.id);

export const usuariosExcluir: TratadorDoCanal<'usuarios:excluir'> = a => excluirConta(a.id);

export const usuariosListar: TratadorDoCanal<'usuarios:listar'> = () => listarContasDeAcesso();

export const usuariosSenha: TratadorDoCanal<'usuarios:senha'> = a => redefinirSenhaPelaAdministracao(a.id);
