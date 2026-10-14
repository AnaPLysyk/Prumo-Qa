/** Lê o código de um arquivo do aplicativo para a Documentação viva, do codigo.json gerado no build (só caminhos que existem nele). */
import fs from 'node:fs';
import path from 'node:path';
import { CodigoDoArquivo, LIMITE_CODIGO_ARQUIVO, LIMITE_CODIGO_TOTAL } from '../tipos/mapaDoAplicativo.js';
import { falharCom } from '../../compartilhado/erros/falharCom.js';
import { raizDoAplicativo } from '../../compartilhado/raizDoAplicativo.js';

let cache: { chave: string; codigo: Map<string, string> } | null = null;

/** O arquivo é do próprio aplicativo: sem atalho, com limite; o caminho pedido só serve de chave (nada é lido do disco por ele). */
export function lerCodigoDoAplicativo(caminho: string, raiz: string = raizDoAplicativo): CodigoDoArquivo {
  const alvo = path.join(raiz, 'app', 'documentacao', 'codigo.json');
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
