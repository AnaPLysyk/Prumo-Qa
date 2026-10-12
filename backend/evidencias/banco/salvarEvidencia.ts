/** Grava a evidência da execução em .prumo/evidencias do projeto, com impressão digital (exceto em projeto somente leitura). */
import { promises as fs } from 'node:fs';
import { caminhoSeguro } from '../../compartilhado/seguranca/caminhoSeguro.js';
import { hash } from '../../compartilhado/seguranca/hash.js';
import { Projeto } from '../../compartilhado/tipos/projeto.js';
import { Evidencia, evidenciaSchema } from '../tipos/evidencia.js';

export async function salvarEvidencia(p:Projeto, e:Evidencia) {
  evidenciaSchema.parse(e);
  if (p.manifesto.execution.readOnly) return { ...e, persisted:false };
  const pasta = await caminhoSeguro(p.raiz,'.prumo/evidencias',true,true);
  await fs.mkdir(pasta,{recursive:true});
  await caminhoSeguro(p.raiz,'.prumo/evidencias',true);
  const texto = JSON.stringify(e,null,2);
  const alvo = await caminhoSeguro(p.raiz,`.prumo/evidencias/${e.jobId}.json`,true,true);
  await fs.writeFile(alvo, JSON.stringify({ sha256:hash(texto), payload:texto },null,2), { flag:'wx', mode:0o600 });
  return { ...e, persisted:true, evidencePath:alvo };
}
