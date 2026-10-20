/** Controlador da funcionalidade suporte: atende canais IPC e delega ao serviço responsável, sem alterar validação nem permissões. */
import { dialog, shell, safeStorage } from "electron";
import { repositorio } from "../ajuda/contratos.js";
import { TratadorDoCanal } from "../aplicativo/api/TratadorDoCanal.js";
import { enderecoOficialDoRelato } from "./servicoRelato.js";
import { prepararRelatoDaJanela } from "./regras/prepararRelatoDaJanela.js";
import { contaDaSessao } from "../login/regras/sessao.js";
import { guardarAnexos } from "./regras/anexosDoChamado.js";
import { consultarChamado } from "./integracoes.js";
import { versao } from "../aplicativo/tipos/aplicativo.js";
import { protetorDoSistema } from "../conexoes/regras/protetorDoSistema.js";
import { enviarChamado, meuChamado, meusChamados } from "./regras/chamadosDaPessoa.js";
import fs from "node:fs";

export const suporteAbrir: TratadorDoCanal<'suporte:abrir'> = async (a, janela) => {
  const p = prepararRelatoDaJanela(a);
  if (!p.ok || !('url' in p)) throw new Error('SUPPORT_BLOCKED_SECRET: o relato contém algo que parece segredo ou está incompleto; revise antes de enviar.');
  if (!enderecoOficialDoRelato(p.url)) throw new Error('SUPPORT_URL_FORBIDDEN: endereço não autorizado.');
  const r = await dialog.showMessageBox(janela!, { type: 'warning', title: 'Abrir formulário do GitHub', buttons: ['Cancelar', 'Abrir no navegador'], defaultId: 0, cancelId: 0, noLink: true,
    message: 'Abrir o formulário de issue já preenchido?', detail: `${p.aviso}

Issues do repositório público ${repositorio} são visíveis para qualquer pessoa. Nada é publicado até você enviar no navegador.

Título: ${p.titulo}${p.truncado ? '\nO texto foi encurtado para caber no endereço; confira no formulário.' : ''}` });
  if (r.response !== 1) return { opened: false };
  await shell.openExternal(p.url); return { opened: true };
};

export const suporteAnexar: TratadorDoCanal<'suporte:anexar'> = async (_a, janela) => {
  const u = contaDaSessao(); if (!u) throw new Error('SESSION_REQUIRED: entre com sua conta do Prumo para continuar.');
  const r = await dialog.showOpenDialog(janela!, { title: 'Anexar ao chamado', properties: ['openFile', 'multiSelections'], filters: [{ name: 'Imagens e vídeos', extensions: ['png', 'jpg', 'jpeg', 'webp', 'mp4', 'webm'] }] });
  return r.canceled ? { aceitos: [], recusados: [] } : guardarAnexos(r.filePaths, u.id);
};

export const suporteChamado: TratadorDoCanal<'suporte:chamado'> = async (a,janela) => {
  const r=await dialog.showMessageBox(janela!,{type:'question',buttons:['Cancelar','Abrir chamado'],defaultId:0,cancelId:0,message:`Abrir o chamado #${a.numero} no GitHub oficial?`});
  if(r.response!==1)return {opened:false};
  await shell.openExternal(`https://github.com/${repositorio}/issues/${a.numero}`);return {opened:true};
};

export const suporteConsultar: TratadorDoCanal<'suporte:consultar'> = a => consultarChamado(a.numero);

export const suporteEnviar: TratadorDoCanal<'suporte:enviar'> = (a) => {
  const u = contaDaSessao(); if (!u) throw new Error('SESSION_REQUIRED: entre com sua conta do Prumo para continuar.');
  return enviarChamado(a, { usuario: u, protetor: protetorDoSistema(safeStorage), versao });
};

export const suporteExportar: TratadorDoCanal<'suporte:exportar'> = async (a, janela) => {
  const p = prepararRelatoDaJanela(a);
  if (!p.ok || !('markdown' in p)) throw new Error('SUPPORT_BLOCKED_SECRET: o relato contém algo que parece segredo ou está incompleto; revise antes de exportar.');
  const destino = await dialog.showSaveDialog(janela!, { title: 'Salvar relato', defaultPath: 'prumo-relato.md', filters: [{ name: 'Markdown', extensions: ['md'] }] });
  if (destino.canceled || !destino.filePath) return { exported: false };
  fs.writeFileSync(destino.filePath, p.markdown, { flag: 'w', mode: 0o600 });
  return { exported: true, path: destino.filePath };
};

export const suporteMeu: TratadorDoCanal<'suporte:meu'> = (a) => {
  const u = contaDaSessao(); if (!u) throw new Error('SESSION_REQUIRED: entre com sua conta do Prumo para continuar.');
  return meuChamado(a.numero, { usuario: u, protetor: protetorDoSistema(safeStorage) });
};

export const suporteMeus: TratadorDoCanal<'suporte:meus'> = () => {
  const u = contaDaSessao(); if (!u) throw new Error('SESSION_REQUIRED: entre com sua conta do Prumo para continuar.');
  return meusChamados({ usuario: u, protetor: protetorDoSistema(safeStorage) });
};

export const suportePreparar: TratadorDoCanal<'suporte:preparar'> = a => prepararRelatoDaJanela(a);
