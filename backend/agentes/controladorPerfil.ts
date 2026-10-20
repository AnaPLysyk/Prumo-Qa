/** Controlador da funcionalidade agentes: atende canais IPC e delega ao serviço responsável, sem alterar validação nem permissões. */
import { dialog } from "electron";
import { autorizarDelegacaoDeIa } from "./regras/autorizarDelegacaoDeIa.js";
import { TratadorDoCanal } from "../aplicativo/api/TratadorDoCanal.js";
import { lerPreferencias } from "../configuracoes/repositorio.js";
import { regrasDosAgentes } from "../administracao/servico.js";
import { lerPerfil } from "./banco/lerPerfil.js";
import { salvarPerfil } from "./banco/salvarPerfil.js";

export const iaDelegacao: TratadorDoCanal<'ia:delegacao'> = async (a, janela) => {
  if (a.valor && !regrasDosAgentes().iaExterna) throw new Error('EXTERNAL_AI_DISABLED: a Administração desligou o uso de Claude Code e Codex nesta instalação.');
  if (a.valor) { const nome = a.provedor === 'claude' ? 'Claude Code' : 'Codex'; const r = await dialog.showMessageBox(janela!, { type: 'question', buttons: ['Cancelar', 'Autorizar ' + nome], defaultId: 0, cancelId: 0, title: 'Autorizar ' + nome + ' no chat', message: 'Permitir que o chat do Prumo envie perguntas ao ' + nome + ' instalado neste computador?', detail: 'Quando você escolher ' + nome + ' no chat, a pergunta, a skill do agente e os fatos locais usados na resposta são enviados ao CLI, que usa a conta e as regras do próprio ' + nome + '. Você pode revogar a qualquer momento.' }); if (r.response !== 1) return { canceled: true, ia: lerPreferencias().ia }; }
  return { canceled: false, ia: autorizarDelegacaoDeIa(a.provedor, a.valor).ia };
};

export const perfilObter: TratadorDoCanal<'perfil:obter'> = () => lerPerfil();

export const perfilSalvar: TratadorDoCanal<'perfil:salvar'> = a => salvarPerfil({
  ...(a.comoChamar !== undefined ? { comoChamar: a.comoChamar } : {}), ...(a.papel !== undefined ? { papel: a.papel } : {}),
  ...(a.experiencia !== undefined ? { experiencia: a.experiencia } : {}), ...(a.foco !== undefined ? { foco: a.foco } : {}), ...(a.compartilharComIa !== undefined ? { compartilharComIa: a.compartilharComIa } : {}) });
