/** Persistência de projetos: operações relacionadas no mesmo módulo. */
import { lerLocal } from "../compartilhado/banco/lerLocal.js";
import { registro, Espaco, arquivoSchema } from "./contratos.js";
import { z } from "zod";
import { gravarLocal } from "../compartilhado/banco/gravarLocal.js";
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { diretorioDados } from "../compartilhado/banco/diretorioDados.js";

export const lerEspacos=(base?:string)=>lerLocal('espacos.json',registro,{version:1,espacos:[]},base);

export const gravarEspacos=(r:z.infer<typeof registro>,base?:string)=>gravarLocal('espacos.json',registro.parse(r),base);

export const listarEspacos=(base?:string)=>lerEspacos(base).espacos;

export function atualizarEspaco(id:string,fn:(e:Espaco)=>void,base?:string){const r=lerEspacos(base);const e=r.espacos.find(e=>e.id===id);if(!e)throw new Error('WORKSPACE_NOT_FOUND');fn(e);gravarEspacos(r,base);return e;}

export function obterEspaco(id:string,base?:string){const e=listarEspacos(base).find(e=>e.id===id);if(!e)throw new Error('WORKSPACE_NOT_FOUND');return e;}

export const arquivoDePastasVinculadas = (base?: string) =>
  path.join(diretorioDados(base), 'vinculos.json');

export function lerPastasVinculadas(base?: string) {
  try {
    const conteudo = fs.readFileSync(arquivoDePastasVinculadas(base), 'utf8');
    return arquivoSchema.parse(JSON.parse(conteudo)).projects;
  } catch (erro) {
    if ((erro as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw new Error('LINKS_INVALID: vinculos.json inválido; corrija ou remova o arquivo.');
  }
}

export function gravarPastasVinculadas(
  projetos: { root: string; addedAt: string }[],
  base?: string
) {
  const destino = arquivoDePastasVinculadas(base);
  fs.mkdirSync(path.dirname(destino), { recursive: true, mode: 0o700 });

  // Arquivo temporário e substituição atômica: nunca gravar parcialmente vínculos.
  const temporario = destino + '.' + randomUUID() + '.tmp';
  fs.writeFileSync(
    temporario,
    JSON.stringify({ version: 1, projects: projetos }, null, 2),
    { mode: 0o600 }
  );
  fs.renameSync(temporario, destino);
}
