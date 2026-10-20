/** Lê e grava configurações da Administração e consulta os arquivos gerados do mapa e do código do aplicativo. */
import { lerLocal, gravarLocal } from "../../compartilhado/banco/persistenciaLocal.js";
import { AgentesDaPlataforma, agentesDaPlataformaPadrao, agentesDaPlataformaSchema, CodigoDoArquivo, LIMITE_CODIGO_ARQUIVO, LIMITE_CODIGO_TOTAL, LIMITE_MAPA, MapaDoAplicativo, mapaDoAplicativoSchema } from "../contratos.js";
import fs from "node:fs";
import path from "node:path";
import { falharCom } from "../../compartilhado/erros.js";
import { raizDoAplicativo } from "../../compartilhado/raizDoAplicativo.js";

export const lerAgentesDaPlataforma = (base?: string): AgentesDaPlataforma =>
  lerLocal<AgentesDaPlataforma>(
    'agentes-plataforma.json',
    agentesDaPlataformaSchema,
    structuredClone(agentesDaPlataformaPadrao),
    base
  );

export function gravarAgentesDaPlataforma(
  configuracao: AgentesDaPlataforma,
  base?: string
): AgentesDaPlataforma {
  const validada = agentesDaPlataformaSchema.parse(configuracao);
  gravarLocal('agentes-plataforma.json', validada, base);
  return validada;
}

let cache: { chave: string; codigo: Map<string, string> } | null = null;

/** O arquivo é do próprio aplicativo: sem atalho, com limite; o caminho pedido só serve de chave (nada é lido do disco por ele). */
export function lerCodigoDoAplicativo(caminho: string, raiz: string = raizDoAplicativo): CodigoDoArquivo {
  const alvo = path.join(raiz, 'dist', 'documentacao', 'codigo.json');
  let st: fs.Stats;
  try { st = fs.lstatSync(alvo); } catch { falharCom('ARCHITECTURE_CODE_MISSING: o código é gerado no build (npm run build).'); }
  if (st.isSymbolicLink() || !st.isFile() || st.size > LIMITE_CODIGO_TOTAL) falharCom('ARCHITECTURE_CODE_INVALID');
  const chave = alvo + ':' + st.size + ':' + st.mtimeMs;
  if (cache?.chave !== chave) {
    let bruto: unknown;
    try { bruto = JSON.parse(fs.readFileSync(alvo, 'utf8')); } catch { falharCom('ARCHITECTURE_CODE_INVALID'); }
    if (!bruto || typeof bruto !== 'object' || Array.isArray(bruto)) falharCom('ARCHITECTURE_CODE_INVALID');
    cache = { chave, codigo: new Map(Object.entries(bruto as Record<string, unknown>).filter((e): e is [string, string] => typeof e[1] === 'string')) };
  }
  const texto = cache.codigo.get(caminho);
  if (texto === undefined) falharCom('ARCHITECTURE_CODE_NOT_FOUND: o arquivo não faz parte do mapa desta versão.');
  const bytes = Buffer.byteLength(texto, 'utf8'); const truncado = bytes > LIMITE_CODIGO_ARQUIVO;
  const final = truncado ? Buffer.from(texto, 'utf8').subarray(0, LIMITE_CODIGO_ARQUIVO).toString('utf8') : texto;
  return { caminho, texto: final, linhas: final.split('\n').length, bytes, truncado };
}

/** O arquivo é do próprio aplicativo (não do projeto da pessoa): sem atalho, com limite e esquema estrito. */
export function lerMapaDoAplicativo(raiz: string = raizDoAplicativo): MapaDoAplicativo {
  const alvo = path.join(raiz, 'dist', 'documentacao', 'mapa.json');
  let st: fs.Stats;
  try { st = fs.lstatSync(alvo); } catch { falharCom('ARCHITECTURE_MAP_MISSING: o mapa é gerado no build (npm run build).'); }
  if (st.isSymbolicLink() || !st.isFile() || st.size > LIMITE_MAPA) falharCom('ARCHITECTURE_MAP_INVALID');
  let bruto: unknown;
  try { bruto = JSON.parse(fs.readFileSync(alvo, 'utf8')); } catch { falharCom('ARCHITECTURE_MAP_INVALID'); }
  const r = mapaDoAplicativoSchema.safeParse(bruto);
  if (!r.success) falharCom('ARCHITECTURE_MAP_INVALID');
  return r.data;
}
