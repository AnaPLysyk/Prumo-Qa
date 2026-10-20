/** Lógica e contratos de ajuda: operações relacionadas no mesmo módulo. */
import fs from "node:fs";
import path from "node:path";
import { documentosAjuda } from "../projetos/tipos/painel.js";

export function lerDocumentosDaAjuda(pasta: string, versao: string) {
  return documentosAjuda.map(arq => {
    const arquivo=arq==='SERVICOS.md'?path.resolve(pasta,'../../docs/SERVICOS.md'):path.join(pasta,arq);
    const texto = fs.readFileSync(arquivo, 'utf8').replaceAll('{{VERSAO}}', versao);
    return { id: arq.replace(/\.md$/, ''), title: /^# (.+)$/m.exec(texto)?.[1] ?? arq, body: texto };
  });
}
