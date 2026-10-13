/** Lê o mapa da Documentação viva que o build gerou em app/documentacao/mapa.json, com limite de tamanho e formato conferido. */
import fs from 'node:fs';
import path from 'node:path';
import { LIMITE_MAPA, MapaDoAplicativo, mapaDoAplicativoSchema } from '../tipos/mapaDoAplicativo.js';
import { falharCom } from '../../compartilhado/erros/falharCom.js';
import { raizDoAplicativo } from '../../compartilhado/raizDoAplicativo.js';

/** O arquivo é do próprio aplicativo (não do projeto da pessoa): sem atalho, com limite e esquema estrito. */
export function lerMapaDoAplicativo(raiz: string = raizDoAplicativo): MapaDoAplicativo {
  const alvo = path.join(raiz, 'app', 'documentacao', 'mapa.json');
  let st: fs.Stats;
  try { st = fs.lstatSync(alvo); } catch { falharCom('ARCHITECTURE_MAP_MISSING: o mapa é gerado no build (npm run build).'); }
  if (st.isSymbolicLink() || !st.isFile() || st.size > LIMITE_MAPA) falharCom('ARCHITECTURE_MAP_INVALID');
  let bruto: unknown;
  try { bruto = JSON.parse(fs.readFileSync(alvo, 'utf8')); } catch { falharCom('ARCHITECTURE_MAP_INVALID'); }
  const r = mapaDoAplicativoSchema.safeParse(bruto);
  if (!r.success) falharCom('ARCHITECTURE_MAP_INVALID');
  return r.data;
}
