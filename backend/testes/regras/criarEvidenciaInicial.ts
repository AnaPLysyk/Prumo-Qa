/** Cria a evidência BLOCKED inicial antes de validar contrato, escopo e autorização humana. */
import { Projeto } from '../../compartilhado/tipos/projeto.js';
import { hash } from '../../compartilhado/seguranca/hash.js';
import { Evidencia } from '../tipos/evidencia.js';

export function criarEvidenciaInicial(p: Projeto, capability: string, jobId: string, inicio: string): Evidencia {
  return {kind:'execution_evidence',jobId,projectId:p.manifesto.id,rootHash:hash(p.raiz),manifestHash:p.manifestoHash,scopeHash:null,capability,status:'BLOCKED',reason:'',startedAt:inicio,endedAt:inicio,executed:false,exitCode:null,command:null,approval:null,cases:[],stdout:'',stderr:'',logSha256:hash('\n'),resultArtifact:null,evidenceScope:'round',provenance:'local-process'};
}
