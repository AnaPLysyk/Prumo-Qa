/** Canal projetos:escolher: Abrir o seletor nativo de pasta e vincular o projeto se o contrato for válido. */
import { dialog } from 'electron';
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';
import { confirmarNoWindows } from '../../aplicativo/janela/confirmarNoWindows.js';
import { adicionarVinculo } from '../regras/adicionarVinculo.js';
import { gravarContratoProposto } from '../regras/gravarContratoProposto.js';
import { proporContrato } from '../regras/proporContrato.js';
import { resumirContratoProposto } from '../regras/resumirContratoProposto.js';
import { situacaoProjeto } from '../regras/situacaoProjeto.js';

export const projetosEscolher: TratadorDoCanal<'projetos:escolher'> = async (_a, janela) => {
  const r = await dialog.showOpenDialog(janela!, { title: 'Selecionar a pasta do projeto', properties: ['openDirectory'] });
  if (r.canceled || !r.filePaths[0]) return { canceled: true };
  // Mesma proposta de contrato do vínculo de projeto Prumo, com aprovação nativa antes de gravar.
  const s = await situacaoProjeto(r.filePaths[0]);
  if (s.state === 'SEM_MANIFESTO') {
    const p = proporContrato(s.root);
    if (!await confirmarNoWindows(janela, 'Criar contrato do projeto', 'Esta pasta ainda não tem qa.project.json. Criar o contrato proposto e vincular?', resumirContratoProposto(p), 'Criar contrato e vincular')) return { canceled: true };
    await gravarContratoProposto(p);
  }
  return { canceled: false, ...(await adicionarVinculo(s.root)) };
};
