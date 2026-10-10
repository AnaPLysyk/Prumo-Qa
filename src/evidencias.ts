import { promises as fs } from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import { caminhoSeguro, lerSeguro, hash, mascarar, ErroQa, type Projeto } from './projeto.js';

export const statusSchema = z.enum(['PASS','FAIL','BLOCKED','NOT_RUN']);
export type Status = z.infer<typeof statusSchema>;
export const casoResultadoSchema = z.object({ id:z.string().min(1).max(100), status:statusSchema, evidence:z.string().min(1).max(4000) }).strict();
export const resultadoRunnerSchema = z.object({ jobId:z.string().uuid(), cases:z.array(casoResultadoSchema).max(1000) }).strict();
export const evidenciaSchema = z.object({
  kind:z.literal('execution_evidence'), jobId:z.string().uuid(), projectId:z.string(), rootHash:z.string(),
  manifestHash:z.string(), scopeHash:z.string().nullable(), capability:z.string(), status:statusSchema,
  reason:z.string(), startedAt:z.string(), endedAt:z.string(), executed:z.boolean(), exitCode:z.number().int().nullable(),
  command:z.unknown(), approval:z.unknown(), cases:z.array(casoResultadoSchema),
  stdout:z.string(), stderr:z.string(), logSha256:z.string(), resultArtifact:z.unknown(),
  evidenceScope:z.enum(['round','individual']), provenance:z.literal('local-process')
}).strict();
export type Evidencia = z.infer<typeof evidenciaSchema>;
export function classificar(exitCode:number|null, blockedReason?:string, cases:z.infer<typeof casoResultadoSchema>[] = []): Status {
  if (blockedReason) return 'BLOCKED';
  if (exitCode === null) return 'NOT_RUN';
  if (exitCode !== 0 || cases.some(c => c.status === 'FAIL')) return 'FAIL';
  if (cases.some(c => c.status === 'BLOCKED')) return 'BLOCKED';
  if (cases.some(c => c.status === 'NOT_RUN')) return 'NOT_RUN';
  return 'PASS';
}
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
export const redigirObjeto = <T>(valor:T):T => JSON.parse(mascarar(JSON.stringify(valor)));
