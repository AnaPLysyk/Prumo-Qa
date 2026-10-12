/** Guarda só os campos úteis do item criado no serviço (id, chave, endereço, detalhes). */
import { Remoto } from '../tipos/operacao.js';

export const limparRespostaRemota = (r: Remoto): Remoto => ({ ...(r.id ? { id: r.id } : {}), ...(r.chave ? { chave: r.chave } : {}), ...(r.url ? { url: r.url } : {}), ...(r.detalhes ? { detalhes: Object.fromEntries(Object.entries(r.detalhes).filter(([, v]) => v !== undefined)) as Record<string, string | number | boolean | null> } : {}) });
