/** Controlador da funcionalidade administracao: atende canais IPC e delega ao serviço responsável, sem alterar validação nem permissões. */
import { configuracaoDeAcesso, salvarConfiguracaoDeAcesso } from "./servico.js";
import { TratadorDoCanal } from "../aplicativo/api/TratadorDoCanal.js";
import { salvarEntradaDoProvedor } from "../login/regras/configuracaoDoLogin.js";

export const acessoConfiguracao: TratadorDoCanal<'acesso:configuracao'> = () => configuracaoDeAcesso();

export const acessoGithub: TratadorDoCanal<'acesso:github'> = a => salvarEntradaDoProvedor('github', a);

export const acessoGoogle: TratadorDoCanal<'acesso:google'> = a => salvarEntradaDoProvedor('google', a);

export const acessoSalvar: TratadorDoCanal<'acesso:salvar'> = a => salvarConfiguracaoDeAcesso(a);
