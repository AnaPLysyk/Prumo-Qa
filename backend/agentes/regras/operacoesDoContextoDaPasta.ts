/** Reúne operacoes do contexto da pasta da funcionalidade, mantendo cada operação identificável pelo nome. */
import { excluirContexto } from "../banco/excluirContexto.js";
import { abrirProjetoVinculado } from "../../projetos/servicoProjetos.js";
import { obterContexto } from "./obterContexto.js";
import { gravarPermissaoDeContextosNoMcp } from "../banco/gravarPermissaoDeContextosNoMcp.js";
import { ErroQa } from "../../compartilhado/erros/ErroQa.js";
import { Projeto } from "../../compartilhado/tipos/projeto.js";
import { mudarContexto } from "../banco/mudarContexto.js";
import { novaVersaoDoContexto, ultimaVersaoDoContexto } from "./versoesDoContexto.js";

export const excluirContextoDaPasta = async (raiz: string, id: string) => excluirContexto(await abrirProjetoVinculado(raiz), id);

export const obterContextoDaPasta = async (raiz: string, id: string) => obterContexto(await abrirProjetoVinculado(raiz), id);

export const permitirContextosNoMcp = async (raiz: string, habilitar: boolean) => gravarPermissaoDeContextosNoMcp(await abrirProjetoVinculado(raiz), habilitar);

const desatualizarContexto = (p: Projeto, id: string, por: string, base?: string) => mudarContexto(p, id, (a) => { const u = ultimaVersaoDoContexto(a); if (u.estado === 'DESATUALIZADO') throw new ErroQa('CONTEXT_NO_CHANGE', 'Já está desatualizado.'); return novaVersaoDoContexto('desatualizado', 'DESATUALIZADO', u.conteudo, por, u); }, base);

export const desatualizarContextoDaPasta = async (raiz: string, id: string, por: string) => desatualizarContexto(await abrirProjetoVinculado(raiz), id, por);
