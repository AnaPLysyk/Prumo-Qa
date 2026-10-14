/** Vincula uma pasta de código ao projeto: confere o contrato (propondo um, com confirmação, se a pasta ainda não tem) e se a pasta já é de outro projeto. */
import { gravarContratoProposto } from './gravarContratoProposto.js';
import { proporContrato } from './proporContrato.js';
import { resumirContratoProposto } from './resumirContratoProposto.js';
import { situacaoProjeto } from './situacaoProjeto.js';
import { vincularPastaAoEspaco } from './vincularPastaAoEspaco.js';

export type Confirmar = (titulo: string, mensagem: string, detalhe: string, botao: string) => Promise<boolean>;

export async function vincularPastaDoDisco(id: string, pasta: string, confirmar: Confirmar) {
  const s = await situacaoProjeto(pasta);
  if (s.state === 'PASTA_AUSENTE') throw new Error('WORKSPACE_LOCAL_FOLDER_MISSING: a pasta escolhida não existe ou não pode ser lida.');
  if (s.state === 'MANIFESTO_INVALIDO') throw new Error(`WORKSPACE_LOCAL_CONTRACT_INVALID: o qa.project.json desta pasta não é válido (${s.message}). Corrija o arquivo, ou apague-o para o Prumo propor um contrato novo, e vincule de novo.`);
  if (s.state === 'SEM_MANIFESTO') {
    const p = proporContrato(s.root);
    if (!await confirmar('Criar contrato do projeto', 'Esta pasta ainda não tem qa.project.json. Criar o contrato proposto e vincular?', resumirContratoProposto(p), 'Criar contrato e vincular')) return { canceled: true as const };
    await gravarContratoProposto(p);
  }
  return vincularPastaAoEspaco(id, s.root);
}
