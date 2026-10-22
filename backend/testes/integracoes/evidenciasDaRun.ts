/** Evidências de um cenário de run local: arquivos da rodada de automação e anexos manuais, sempre nas pastas de evidência do projeto. */
// O envio ao Qase só aceita arquivos de .prumo/evidencias, .prumo/resultados e .prumo/artefatos; o que o runner gera ou a pessoa anexa vai para lá.
import fs from "node:fs";
import path from "node:path";
import { mascarar } from "../../compartilhado/seguranca/mascarar.js";
import { tipos } from "../../tickets/contratos.js";
import { Evidencia, evidenciaSchema } from "../tipos/catalogoDeTestes.js";
import { RunLocal } from "../tipos/runLocal.js";

export const LIMITE_DE_ARQUIVOS = 10;
const LIMITE_DE_BYTES = 10 * 1024 * 1024; const LIMITE_DA_PREVIA = 1536 * 1024; const LIMITE_DO_TEXTO = 20000;
const TEXTO = ['.txt', '.log', '.json', '.html']; const SEGREDO = /\.(env|pem|key|pfx|p12)$/i; const UUID = /^[0-9a-f-]{36}$/i;

export type ArquivoDeEvidencia = { caminho: string; nome: string; origem: 'rodada' | 'manual'; tipo: string; tamanho: number };

export function pastasDeEvidencia(pasta: string) {
  const prumo = path.join(pasta, '.prumo'); const evidencias = path.join(prumo, 'evidencias'), resultados = path.join(prumo, 'resultados'), artefatos = path.join(prumo, 'artefatos');
  return { evidencias, resultados, artefatos, raizes: [evidencias, resultados, artefatos] };
}

/** Arquivo comum (sem atalho nem link), de tipo conhecido, com tamanho aceito e que não parece guardar segredo. */
function infoDoArquivo(caminho: string): { tamanho: number; tipo: string } | null {
  try {
    const st = fs.lstatSync(caminho); const tipo = tipos[path.extname(caminho).toLowerCase()];
    return !st.isFile() || st.nlink !== 1 || st.size === 0 || st.size > LIMITE_DE_BYTES || !tipo || SEGREDO.test(caminho) ? null : { tamanho: st.size, tipo };
  } catch { return null; }
}

function dosArquivosDe(pastaDeArquivos: string, origem: ArquivoDeEvidencia['origem']): ArquivoDeEvidencia[] {
  try {
    return fs.readdirSync(pastaDeArquivos, { withFileTypes: true }).filter(d => d.isFile()).map(d => path.join(pastaDeArquivos, d.name)).sort()
      .flatMap(c => { const v = infoDoArquivo(c); return v ? [{ caminho: c, nome: path.basename(c), origem, ...v }] : []; });
  } catch { return []; }
}

/** Evidência da rodada de automação, como o runner a gravou. Sem a pasta ou com o arquivo inválido, devolve null. */
export function lerRodada(pasta: string, jobId: string): Evidencia | null {
  if (!UUID.test(jobId)) return null;
  try { const bruto = JSON.parse(fs.readFileSync(path.join(pastasDeEvidencia(pasta).evidencias, `${jobId}.json`), 'utf8')) as { payload: string }; return evidenciaSchema.parse(JSON.parse(bruto.payload)); } catch { return null; }
}

const textoDoLog = (e: Evidencia) => mascarar(`# stdout\n${e.stdout}\n\n# stderr\n${e.stderr}\n`);

/** Arquivos da rodada: JSON da evidência, log (stdout e stderr mascarados), relatório do runner e o que a automação deixou em .prumo/artefatos/<job>/. */
export function arquivosDaRodada(pasta: string, jobId: string, gravarLog: boolean): ArquivoDeEvidencia[] {
  if (!UUID.test(jobId)) return []; const p = pastasDeEvidencia(pasta); const lista: ArquivoDeEvidencia[] = [];
  const acrescentar = (c: string) => { const v = infoDoArquivo(c); if (v) lista.push({ caminho: c, nome: path.basename(c), origem: 'rodada', ...v }); };
  acrescentar(path.join(p.evidencias, `${jobId}.json`));
  const rodada = lerRodada(pasta, jobId);
  if (rodada && (rodada.stdout || rodada.stderr)) {
    const log = path.join(p.artefatos, `${jobId}.log`); const texto = textoDoLog(rodada);
    if (gravarLog && !fs.existsSync(log)) { fs.mkdirSync(p.artefatos, { recursive: true }); fs.writeFileSync(log, texto, { encoding: 'utf8', flag: 'wx' }); }
    if (fs.existsSync(log)) acrescentar(log); else lista.push({ caminho: log, nome: path.basename(log), origem: 'rodada', tipo: tipos['.log']!, tamanho: Buffer.byteLength(texto) });
  }
  acrescentar(path.join(p.resultados, `${jobId}.json`));
  lista.push(...dosArquivosDe(path.join(p.artefatos, jobId), 'rodada'));
  return lista;
}

export const pastaDaEvidenciaManual = (pasta: string, runId: string, casoId: number) => path.join(pastasDeEvidencia(pasta).evidencias, 'runs', runId, String(casoId));

/** Tudo o que pertence ao cenário: o que a pessoa anexou e o que a rodada de automação gerou. No máximo 10 arquivos (o limite do Qase por resultado). */
export function arquivosDoCenario(pasta: string, run: Pick<RunLocal, 'id'>, caso: RunLocal['casos'][number], gravarLog: boolean): ArquivoDeEvidencia[] {
  const manuais = dosArquivosDe(pastaDaEvidenciaManual(pasta, run.id, caso.casoId), 'manual');
  const jobId = caso.resultado?.evidenciaId; const rodada = jobId ? arquivosDaRodada(pasta, jobId, gravarLog) : [];
  return [...manuais, ...rodada].slice(0, LIMITE_DE_ARQUIVOS);
}

/** Copia arquivos escolhidos pela pessoa para a pasta de evidência do cenário. Texto é copiado com segredos mascarados. */
export function copiarEvidenciaManual(pasta: string, runId: string, casoId: number, origens: string[]) {
  const destino = pastaDaEvidenciaManual(pasta, runId, casoId); fs.mkdirSync(destino, { recursive: true });
  const adicionados: string[] = []; const recusados: { nome: string; motivo: string }[] = []; let total = dosArquivosDe(destino, 'manual').length;
  for (const origem of origens) {
    const nome = path.basename(origem); const v = infoDoArquivo(origem);
    if (!v) { recusados.push({ nome, motivo: 'TIPO_OU_TAMANHO_NAO_ACEITO' }); continue; }
    if (total >= LIMITE_DE_ARQUIVOS) { recusados.push({ nome, motivo: 'LIMITE_DE_ARQUIVOS' }); continue; }
    const ext = path.extname(nome); const base = path.basename(nome, ext).replace(/[^\w.\- ]+/g, '_').slice(0, 80) || 'evidencia'; let final = base + ext.toLowerCase(); let n = 1;
    while (fs.existsSync(path.join(destino, final))) final = `${base}-${++n}${ext.toLowerCase()}`;
    const alvo = path.join(destino, final);
    if (TEXTO.includes(ext.toLowerCase())) fs.writeFileSync(alvo, mascarar(fs.readFileSync(origem, 'utf8')), { encoding: 'utf8', flag: 'wx' }); else fs.copyFileSync(origem, alvo, fs.constants.COPYFILE_EXCL);
    adicionados.push(final); total++;
  }
  return { adicionados, recusados };
}

/** O que a tela mostra de um cenário: resumo da rodada, log e os arquivos (com prévia de imagem e texto curto). Nunca devolve caminhos do disco. */
export function evidenciasDoCenario(pasta: string, run: Pick<RunLocal, 'id'>, caso: RunLocal['casos'][number]) {
  const jobId = caso.resultado?.evidenciaId; const e = jobId ? lerRodada(pasta, jobId) : null;
  const cenario = e && caso.casoRunner ? e.cases.find(c => c.id === caso.casoRunner) : undefined;
  const arquivos = arquivosDoCenario(pasta, run, caso, false).map(a => {
    let previa: string | undefined; let texto: string | undefined;
    try {
      if (a.tipo.startsWith('image/') && a.tamanho <= LIMITE_DA_PREVIA) previa = `data:${a.tipo};base64,${fs.readFileSync(a.caminho).toString('base64')}`;
      else if (TEXTO.includes(path.extname(a.nome).toLowerCase())) texto = (fs.existsSync(a.caminho) ? mascarar(fs.readFileSync(a.caminho, 'utf8')) : e ? textoDoLog(e) : '').slice(0, LIMITE_DO_TEXTO);
    } catch { /* arquivo sumiu ou não pôde ser lido: aparece só na lista */ }
    return { nome: a.nome, origem: a.origem, tipo: a.tipo, tamanho: a.tamanho, ...(previa ? { previa } : {}), ...(texto ? { texto } : {}) };
  });
  return {
    rodada: e ? { automacao: e.capability, status: e.status, motivo: mascarar(e.reason).slice(0, 600), inicio: e.startedAt, fim: e.endedAt, escopo: e.evidenceScope, cenario: cenario ? { id: cenario.id, status: cenario.status, evidencia: mascarar(cenario.evidence) } : null } : null,
    arquivos
  };
}
