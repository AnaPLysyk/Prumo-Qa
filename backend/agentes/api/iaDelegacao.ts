/** Canal ia:delegacao: Autorizar ou revogar a delegação do chat ao Claude Code ou Codex. */
import { dialog } from 'electron';
import { autorizarDelegacaoDeIa } from '../regras/autorizarDelegacaoDeIa.js';
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';
import { lerPreferencias } from '../../configuracoes/banco/lerPreferencias.js';
import { regrasDosAgentes } from '../../administracao/regras/agentesDaPlataforma.js';

export const iaDelegacao: TratadorDoCanal<'ia:delegacao'> = async (a, janela) => {
  if (a.valor && !regrasDosAgentes().iaExterna) throw new Error('EXTERNAL_AI_DISABLED: a Administração desligou o uso de Claude Code e Codex nesta instalação.');
  if (a.valor) { const nome = a.provedor === 'claude' ? 'Claude Code' : 'Codex'; const r = await dialog.showMessageBox(janela!, { type: 'question', buttons: ['Cancelar', 'Autorizar ' + nome], defaultId: 0, cancelId: 0, title: 'Autorizar ' + nome + ' no chat', message: 'Permitir que o chat do Prumo envie perguntas ao ' + nome + ' instalado neste computador?', detail: 'Quando você escolher ' + nome + ' no chat, a pergunta, a skill do agente e os fatos locais usados na resposta são enviados ao CLI, que usa a conta e as regras do próprio ' + nome + '. Você pode revogar a qualquer momento.' }); if (r.response !== 1) return { canceled: true, ia: lerPreferencias().ia }; }
  return { canceled: false, ia: autorizarDelegacaoDeIa(a.provedor, a.valor).ia };
};
