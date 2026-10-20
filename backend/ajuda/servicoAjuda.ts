/** Serviço da Ajuda: documentos e privacidade dos dados. */
import fs from "node:fs";
import path from "node:path";
import { documentosAjuda } from "../projetos/contratos.js";
import { categorias, limitesPrivacidade, naoTransmitido, politicaRetencao } from "./contratos.js";
import { diretorioDados } from "../compartilhado/banco/diretorioDados.js";
import { listarVinculos } from "../projetos/servicoProjetos.js";

// servicoDocumentos — responsabilidade deste trecho
export function lerDocumentosDaAjuda(pasta: string, versao: string) {
  return documentosAjuda.map(arq => {
    const arquivo=arq==='SERVICOS.md'?path.resolve(pasta,'../../docs/SERVICOS.md'):path.join(pasta,arq);
    const texto = fs.readFileSync(arquivo, 'utf8').replaceAll('{{VERSAO}}', versao);
    return { id: arq.replace(/\.md$/, ''), title: /^# (.+)$/m.exec(texto)?.[1] ?? arq, body: texto };
  });
}

// servicoPrivacidade — responsabilidade deste trecho
function medirPasta(dir: string, limite = { n: 0 }): { bytes: number; arquivos: number; truncado: boolean } {
  let bytes = 0, arquivos = 0, truncado = false;
  let itens: fs.Dirent[]; try { itens = fs.readdirSync(dir, { withFileTypes: true }); } catch { return { bytes, arquivos, truncado }; }
  for (const i of itens) {
    if (++limite.n > 50000) return { bytes, arquivos, truncado: true };
    const alvo = path.join(dir, i.name);
    if (i.isSymbolicLink()) continue;
    if (i.isDirectory()) { const r = medirPasta(alvo, limite); bytes += r.bytes; arquivos += r.arquivos; truncado ||= r.truncado; }
    else if (i.isFile()) { try { bytes += fs.statSync(alvo).size; arquivos++; } catch { /* arquivo sumiu: ignora */ } }
  }
  return { bytes, arquivos, truncado };
}

export async function resumirDados(base?: string) {
  const dir = diretorioDados(base); const por: Record<string, { bytes: number; files: number }> = {};
  let total = 0, truncado = false;
  let itens: fs.Dirent[] = []; try { itens = fs.readdirSync(dir, { withFileTypes: true }); } catch { /* ainda sem dados */ }
  for (const i of itens) {
    if (i.isSymbolicLink()) continue;
    const alvo = path.join(dir, i.name); const cat = categorias[i.name] ?? 'outros';
    const r = i.isDirectory() ? medirPasta(alvo) : { bytes: (() => { try { return fs.statSync(alvo).size; } catch { return 0; } })(), arquivos: 1, truncado: false };
    por[cat] = { bytes: (por[cat]?.bytes ?? 0) + r.bytes, files: (por[cat]?.files ?? 0) + r.arquivos }; total += r.bytes; truncado ||= r.truncado;
  }
  return { directory: dir, linkedProjects: (await listarVinculos(base)).length, totalBytes: total, truncated: truncado, categories: por,
    evidenceNote: 'Evidências de execução ficam em <projeto>\\.prumo\\evidencias, dentro de cada projeto vinculado, e não entram neste total.',
    retention: politicaRetencao, notTransmitted: naoTransmitido, privacyLimits: limitesPrivacidade };
}
