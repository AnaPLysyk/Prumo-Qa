/** Canal suporte:anexar: Escolher imagens (até 3) ou um vídeo para o chamado, no diálogo do sistema; a janela recebe só id, nome, tipo e tamanho. */
import { dialog } from 'electron';
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';
import { contaDaSessao } from '../../login/regras/sessao.js';
import { guardarAnexos } from '../regras/anexosDoChamado.js';

export const suporteAnexar: TratadorDoCanal<'suporte:anexar'> = async (_a, janela) => {
  const u = contaDaSessao(); if (!u) throw new Error('SESSION_REQUIRED: entre com sua conta do Prumo para continuar.');
  const r = await dialog.showOpenDialog(janela!, { title: 'Anexar ao chamado', properties: ['openFile', 'multiSelections'], filters: [{ name: 'Imagens e vídeos', extensions: ['png', 'jpg', 'jpeg', 'webp', 'mp4', 'webm'] }] });
  return r.canceled ? { aceitos: [], recusados: [] } : guardarAnexos(r.filePaths, u.id);
};
