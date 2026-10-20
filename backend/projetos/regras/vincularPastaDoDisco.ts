/** Vincula uma pasta de código ao projeto: confere o contrato (propondo um, com confirmação, se a pasta ainda não tem) e se a pasta já é de outro projeto. */
import { gravarContratoProposto } from './gravarContratoProposto.js';
import { proporContrato } from './proporContrato.js';
import { resumirContratoProposto } from './resumirContratoProposto.js';
import { situacaoProjeto } from './situacaoProjeto.js';
import { atualizarEspaco } from '../banco/atualizarEspaco.js';
import { listarEspacos } from '../banco/listarEspacos.js';
import { obterEspaco } from '../banco/obterEspaco.js';
import { adicionarVinculo } from './adicionarVinculo.js';
import { eventoEspaco } from './eventoEspaco.js';

async function vincularPastaAoEspaco(id:string,raiz:string,base?:string){
  obterEspaco(id,base);const s=await situacaoProjeto(raiz);if(s.state!=='INTEGRADO')throw new Error('WORKSPACE_LOCAL_CONTRACT_INVALID');
  const outra=listarEspacos(base).find(e=>e.id!==id&&e.pastaLocal?.toLowerCase()===s.root.toLowerCase());if(outra)throw new Error('WORKSPACE_LOCAL_DUPLICATE');
  await adicionarVinculo(s.root,base);return atualizarEspaco(id,e=>{e.pastaLocal=s.root;eventoEspaco(e,'PASTA');},base);
}



type Confirmar = (titulo: string, mensagem: string, detalhe: string, botao: string) => Promise<boolean>;

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
