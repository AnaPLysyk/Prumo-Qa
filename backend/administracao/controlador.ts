/** Controlador da Administração: os canais da tela, agrupados por assunto. */
import { safeStorage } from "electron";
import { TratadorDoCanal } from "../aplicativo/api/TratadorDoCanal.js";
import { lerCodigoDoAplicativo, lerMapaDoAplicativo } from "./banco/administracao.js";
import { agentesDaPlataformaParaJanela, salvarAgentesDaPlataforma, configuracaoDeAcesso, salvarConfiguracaoDeAcesso, excluirPapel, listarPapeis, salvarPapel, alterarContaPelaAdministracao, criarContaPelaAdministracao, desbloquearConta, excluirConta, listarContasDeAcesso, redefinirSenhaPelaAdministracao } from "./servico.js";
import { salvarEntradaDoProvedor } from "../login/regras/configuracaoDoLogin.js";
import { ativarLogin } from "../login/regras/contas.js";
import { protetorDoSistema } from "../conexoes/regras/protetorDoSistema.js";
import { chamadosDaAdministracao, salvarChaveDeAdministracao, lerChaveDeAdministracao } from "../suporte/regras/chamadosDaAdministracao.js";
import { ENDERECO_DO_SERVICO } from "../compartilhado/servicoRemoto.js";

// Plataforma
export const administracaoCodigo: TratadorDoCanal<'administracao:codigo'> = a => lerCodigoDoAplicativo(a.caminho);

export const administracaoMapa: TratadorDoCanal<'administracao:mapa'> = () => lerMapaDoAplicativo();

export const plataformaAgentes: TratadorDoCanal<'plataforma:agentes'> = () => agentesDaPlataformaParaJanela();

export const plataformaSalvar: TratadorDoCanal<'plataforma:salvar'> = a => salvarAgentesDaPlataforma(a);

// Acesso e OAuth
export const acessoConfiguracao: TratadorDoCanal<'acesso:configuracao'> = () => configuracaoDeAcesso();

export const acessoGithub: TratadorDoCanal<'acesso:github'> = a => salvarEntradaDoProvedor('github', a);

export const acessoGoogle: TratadorDoCanal<'acesso:google'> = a => salvarEntradaDoProvedor('google', a);

export const acessoSalvar: TratadorDoCanal<'acesso:salvar'> = a => salvarConfiguracaoDeAcesso(a);

// Usuários
export const usuariosAlterar: TratadorDoCanal<'usuarios:alterar'> = a => alterarContaPelaAdministracao(a);

export const usuariosAtivar: TratadorDoCanal<'usuarios:ativar'> = a => ativarLogin(a);

export const usuariosCriar: TratadorDoCanal<'usuarios:criar'> = a => criarContaPelaAdministracao(a);

export const usuariosDesbloquear: TratadorDoCanal<'usuarios:desbloquear'> = a => desbloquearConta(a.id);

export const usuariosExcluir: TratadorDoCanal<'usuarios:excluir'> = a => excluirConta(a.id);

export const usuariosListar: TratadorDoCanal<'usuarios:listar'> = () => listarContasDeAcesso();

export const usuariosSenha: TratadorDoCanal<'usuarios:senha'> = a => redefinirSenhaPelaAdministracao(a.id);

// Papéis
export const papeisExcluir: TratadorDoCanal<'papeis:excluir'> = a => excluirPapel(a.id);

export const papeisListar: TratadorDoCanal<'papeis:listar'> = () => listarPapeis();

export const papeisSalvar: TratadorDoCanal<'papeis:salvar'> = a => salvarPapel(a);

// Chamados
export const chamadosAnexo: TratadorDoCanal<'chamados:anexo'> = (a) => chamadosDaAdministracao.anexo(a.numero, a.indice, { protetor: protetorDoSistema(safeStorage) });

export const chamadosChave: TratadorDoCanal<'chamados:chave'> = (a) => salvarChaveDeAdministracao(a.chave, protetorDoSistema(safeStorage));

export const chamadosConfiguracao: TratadorDoCanal<'chamados:configuracao'> = () => ({ configurada: !!lerChaveDeAdministracao(protetorDoSistema(safeStorage)), servico: new URL(process.env.PRUMO_SERVICO || ENDERECO_DO_SERVICO).origin });

export const chamadosDetalhe: TratadorDoCanal<'chamados:detalhe'> = (a) => chamadosDaAdministracao.detalhe(a.numero, { protetor: protetorDoSistema(safeStorage) });

export const chamadosEstado: TratadorDoCanal<'chamados:estado'> = (a) => chamadosDaAdministracao.mudarEstado(a.numero, a.estado, { protetor: protetorDoSistema(safeStorage) });

export const chamadosListar: TratadorDoCanal<'chamados:listar'> = (a) => chamadosDaAdministracao.listar(a.estado, { protetor: protetorDoSistema(safeStorage) });

export const chamadosResponder: TratadorDoCanal<'chamados:responder'> = (a) => chamadosDaAdministracao.responder(a.numero, a.texto, { protetor: protetorDoSistema(safeStorage) });
