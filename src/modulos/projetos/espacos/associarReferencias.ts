/** Liga ticket, caso, run e outras referências sem inferir associação por nome. */
import {randomUUID} from 'node:crypto';
import {z} from 'zod';
import {associacaoSchema, referencia, type Servico} from './definicoesEspaco.js';
import {atualizar, eventoEspaco} from './armazenarEspacos.js';

/** Serviço exigido (pelo vínculo do projeto) para cada tipo de referência remota. */
export const servicoDaReferencia:Partial<Record<z.infer<typeof referencia>['tipo'],Servico>>={jira:'jira','jira-bug':'jira',qase:'qase','qase-run':'qase','qase-defeito':'qase',github:'github','github-pr':'github','github-commit':'github'};
/** `registradoPeloPrumo`: vínculo criado por um fluxo do Prumo (ex.: bug aberto a partir de uma falha), nunca deduzido por nome. */
export function associarEspaco(id:string,dados:z.input<typeof associacaoSchema>,base?:string,registradoPeloPrumo=false){const d=associacaoSchema.parse(dados);return atualizar(id,e=>{
  for(const ref of[d.de,d.para]){const s=servicoDaReferencia[ref.tipo];if(s&&(!ref.vinculoId||!e.vinculos.some(v=>v.id===ref.vinculoId&&v.servico===s)))throw new Error('TRACE_LINK_SCOPE');}
  if(e.relacoes.some(r=>JSON.stringify(r.de)===JSON.stringify(d.de)&&JSON.stringify(r.para)===JSON.stringify(d.para)))throw new Error('TRACE_DUPLICATE');
  e.relacoes.push({...d,id:randomUUID(),at:new Date().toISOString(),estado:'VINCULADO',origemRegistro:registradoPeloPrumo?'REGISTRADO_PELO_PRUMO':'DECLARADO_PELO_USUARIO'});e.relacoes=e.relacoes.slice(-500);eventoEspaco(e,'ASSOCIADO');},base);}
