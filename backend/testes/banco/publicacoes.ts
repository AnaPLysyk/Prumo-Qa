/** publicacoes: fluxo consolidado por responsabilidade, com operações identificadas por nome. */
import { z } from "zod";
import { lerLocal, gravarLocal } from "../../compartilhado/banco/persistenciaLocal.js";
import { Registro, registro } from "../tipos/escritaQase.js";
import { promises as fs } from "node:fs";
import path from "node:path";
import { ErroQa } from "../../compartilhado/erros.js";
import { caminhoSeguro, lerSeguro } from "../../compartilhado/seguranca/caminhoSeguro.js";
import { hash } from "../../compartilhado/seguranca/hash.js";
import { Projeto } from "../../compartilhado/projeto/contratos.js";
import { evidenciaSchema, Evidencia } from "../tipos/catalogoDeTestes.js";

// --- publicacoes ---
export const publicacaoDoTrabalho = (id: string, b?: string) => lerPublicacoesJira(b).itens.find(x => x.trabalhoId === id) ?? null;

export const lerPublicacoesJira = (base?: string): Registro =>
  lerLocal<Registro>(
    'publicacoes-jira.json',
    registro as unknown as z.ZodType<Registro>,
    { version: 1, itens: [] },
    base
  );

export const gravarPublicacoesJira = (publicacoes: Registro, base?: string) => {
  if (publicacoes.itens.length > 1000) {
    publicacoes.itens = publicacoes.itens.slice(-1000);
  }
  gravarLocal('publicacoes-jira.json', registro.parse(publicacoes), base);
};

// --- evidencias ---
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

/**
 * Exclusão controlada das evidências de execução de um projeto. Escopo: .prumo/evidencias/<uuid>.json regulares,
 * validados por caminhoSeguro (sem links nem fuga da raiz). Nunca toca código, documentos ou outros projetos.
 */
export async function excluirEvidencias(p:Projeto) {
  const pasta = await caminhoSeguro(p.raiz,'.prumo/evidencias',true,true);
  let nomes:string[]; try { nomes=(await fs.readdir(pasta)).filter(n => /^[0-9a-f-]{36}\.json$/i.test(n)); }
  catch(e) { if ((e as NodeJS.ErrnoException).code==='ENOENT') return { deleted:0, failed:[] as { file:string; code:string }[] }; throw e; }
  const failed:{ file:string; code:string }[]=[]; let deleted=0;
  for (const n of nomes) {
    try {
      const alvo = await caminhoSeguro(p.raiz,`.prumo/evidencias/${n}`,true);
      const st = await fs.lstat(alvo); if (!st.isFile() || st.nlink!==1) throw Object.assign(new Error('x'),{ code:'FILE_INVALID' });
      await fs.unlink(alvo); deleted++;
    } catch(e) { failed.push({ file:n, code:(e as NodeJS.ErrnoException).code ?? (e as ErroQa).codigo ?? 'UNKNOWN' }); }
  }
  try { await fs.rmdir(pasta); } catch { /* restam arquivos */ }
  return { deleted, failed };
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
