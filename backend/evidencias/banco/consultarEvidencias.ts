/** Lê as evidências do projeto conferindo integridade e se pertencem a este projeto; sem evidência, responde NOT_RUN. */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import { ErroQa } from '../../compartilhado/erros/ErroQa.js';
import { caminhoSeguro } from '../../compartilhado/seguranca/caminhoSeguro.js';
import { hash } from '../../compartilhado/seguranca/hash.js';
import { lerSeguro } from '../../compartilhado/seguranca/lerSeguro.js';
import { Projeto } from '../../compartilhado/tipos/projeto.js';
import { evidenciaSchema } from '../tipos/evidencia.js';

export async function consultarEvidencias(p:Projeto, jobId?:string, criterio?:string) {
  if (jobId && !z.string().uuid().safeParse(jobId).success) throw new ErroQa('INVALID_JOB','ID de job inválido.');
  const pasta = await caminhoSeguro(p.raiz,'.prumo/evidencias',true,true);
  let nomes:string[];
  try { await caminhoSeguro(p.raiz,'.prumo/evidencias',true); nomes=(await fs.readdir(pasta)).filter(n => /^[0-9a-f-]{36}\.json$/i.test(n)).sort(); }
  catch(e) { if ((e as NodeJS.ErrnoException).code === 'ENOENT') return { projectId:p.manifesto.id,status:'NOT_RUN',reason:'Nenhuma evidência disponível.',results:[] }; throw e; }
  if (jobId) nomes = nomes.filter(n => n === `${jobId}.json`);
  if (nomes.length > 1000) throw new ErroQa('EVIDENCE_LIMIT','Mais de 1000 jobs; consultar por ID.');
  const results = [];
  for (const n of nomes) {
    const raw = JSON.parse(await lerSeguro(p.raiz,`.prumo/evidencias/${n}`,true,2097152));
    if (typeof raw.payload !== 'string' || hash(raw.payload) !== raw.sha256) throw new ErroQa('EVIDENCE_TAMPERED','Integridade da evidência inválida.');
    const e = evidenciaSchema.parse(JSON.parse(raw.payload));
    if (e.jobId+'.json' !== n || e.projectId !== p.manifesto.id || e.rootHash !== hash(p.raiz)) throw new ErroQa('PROJECT_MISMATCH','Evidência pertence a outro contexto.');
    if (hash(e.stdout+'\n'+e.stderr) !== e.logSha256) throw new ErroQa('EVIDENCE_TAMPERED','Log alterado.');
    const cases = criterio ? e.cases.filter(c => c.id === criterio) : e.cases;
    if (criterio && !cases.length) continue;
    results.push({ ...e,cases,evidencePath:path.join(pasta,n) });
  }
  return { projectId:p.manifesto.id, ...(results.length ? {} : { status:'NOT_RUN',reason:'Não existe evidência para a consulta.' }), results,
    trust:'Hashes detectam corrupção acidental. Administrador com escrita no host pode alterar arquivos; não é assinatura de auditoria.' };
}
