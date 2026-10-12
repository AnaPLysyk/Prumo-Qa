/** Registra uma ligação explícita entre dois itens (ex.: ticket Jira ↔ caso Qase) no projeto, recusando duplicadas e serviços não vinculados. */
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { atualizarEspaco } from '../banco/atualizarEspaco.js';
import { eventoEspaco } from './eventoEspaco.js';
import { associacaoSchema, servicoDaReferencia } from '../tipos/espacos.js';

/** `registradoPeloPrumo`: vínculo criado por um fluxo do Prumo (ex.: bug aberto a partir de uma falha), nunca deduzido por nome. */
export function associarEspaco(id:string,dados:z.input<typeof associacaoSchema>,base?:string,registradoPeloPrumo=false){const d=associacaoSchema.parse(dados);return atualizarEspaco(id,e=>{
  for(const ref of[d.de,d.para]){const s=servicoDaReferencia[ref.tipo];if(s&&(!ref.vinculoId||!e.vinculos.some(v=>v.id===ref.vinculoId&&v.servico===s)))throw new Error('TRACE_LINK_SCOPE');}
  if(e.relacoes.some(r=>JSON.stringify(r.de)===JSON.stringify(d.de)&&JSON.stringify(r.para)===JSON.stringify(d.para)))throw new Error('TRACE_DUPLICATE');
  e.relacoes.push({...d,id:randomUUID(),at:new Date().toISOString(),estado:'VINCULADO',origemRegistro:registradoPeloPrumo?'REGISTRADO_PELO_PRUMO':'DECLARADO_PELO_USUARIO'});e.relacoes=e.relacoes.slice(-500);eventoEspaco(e,'ASSOCIADO');},base);}
