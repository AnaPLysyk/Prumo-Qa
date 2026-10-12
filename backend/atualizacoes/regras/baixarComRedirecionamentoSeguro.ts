/** Baixa seguindo só redirecionamentos permitidos. */
import path from 'node:path';
import { downloadPermitido } from './downloadPermitido.js';
import { Opcoes } from '../tipos/instalador.js';

/** GET com redirecionamento seguido à mão: cada salto é conferido contra a lista de hosts. */
export async function baixarComRedirecionamentoSeguro(inicial: string, o: Opcoes): Promise<Response> {
  let url = new URL(inicial);
  for (let saltos = 0; saltos < 6; saltos++) {
    if (!downloadPermitido(url, !!o.permitirLocal)) throw new Error(`UPDATE_DESTINATION_FORBIDDEN: destino de download não autorizado (${url.hostname}).`);
    let r: Response;
    try { r = await (o.buscar ?? fetch)(url, { method: 'GET', redirect: 'manual', credentials: 'omit', cache: 'no-store', headers: { 'User-Agent': 'PrumoQA-atualizacao' }, signal: AbortSignal.timeout(o.timeoutMs ?? 10 * 60 * 1000) }); }
    catch (e) { throw new Error(`UPDATE_DOWNLOAD_FAILED: não foi possível baixar do GitHub (${(e as Error).name === 'TimeoutError' ? 'tempo esgotado' : 'sem conexão ou recusado'}). Nada foi instalado.`); }
    if (r.status >= 300 && r.status < 400) { const destino = r.headers.get('location'); if (!destino) break; url = new URL(destino, url); continue; }
    if (!r.ok) throw new Error(`UPDATE_DOWNLOAD_FAILED: o GitHub respondeu HTTP ${r.status} ao baixar ${path.basename(url.pathname)}. Nada foi instalado.`);
    return r;
  }
  throw new Error('UPDATE_DOWNLOAD_FAILED: redirecionamentos demais ao baixar. Nada foi instalado.');
}
