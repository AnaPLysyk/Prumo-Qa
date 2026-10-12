/** Grava somente o relatório de testes redigido e remove artefatos não validados. */
import { promises as fs } from 'node:fs';
import { Projeto } from '../../compartilhado/tipos/projeto.js';
import { Evidencia } from '../../evidencias/tipos/evidencia.js';
import { caminhoSeguro } from '../../compartilhado/seguranca/caminhoSeguro.js';
import { hash } from '../../compartilhado/seguranca/hash.js';

export async function gravarRelatorioRedigido(p:Projeto,e:Evidencia,jobId:string,resultadoRel:string):Promise<void> {
  // Artefato bruto pode conter segredos: só persistir versão redigida.
  if(e.resultArtifact) {
    const sanitized=JSON.stringify({jobId,cases:e.cases},null,2);
    const resultadoPath=await caminhoSeguro(p.raiz,resultadoRel,true);
    await fs.writeFile(resultadoPath,sanitized,{mode:0o600});
    e.resultArtifact={path:resultadoRel,sha256:hash(sanitized),trust:'Relatório do runner autorizado, redigido; sem julgamento independente.'};
  }
  else { try { const resultadoPath=await caminhoSeguro(p.raiz,resultadoRel,true);await fs.unlink(resultadoPath); } catch {} }
}
