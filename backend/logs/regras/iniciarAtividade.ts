/** Registra o início de uma operação (ferramenta, origem, contagens da entrada) e devolve como registrar o término. */
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import { falharCom } from '../../compartilhado/erros.js';
import { hash } from '../../compartilhado/seguranca/hash.js';
import { semLinks } from '../../compartilhado/seguranca/semLinks.js';
import { Projeto } from '../../compartilhado/tipos/projeto.js';
import { arquivosDoDiario } from '../banco/arquivosDoDiario.js';
import { gravarNoDiario } from '../banco/gravarNoDiario.js';
import { pastaAtividades } from '../banco/pastaAtividades.js';
import { achadoELacuna } from './resumoDoDiario.js';

import { Evento, Origem, codigos, estados, ferramentas, limitesHistorico, orientacoes, referenciaSchema } from '../contratos.js';
import { resumoSchema } from '../contratos.js';

const resumoVazio = ():z.infer<typeof resumoSchema> => ({findings:0,recommendations:0,gaps:0,candidateRedundancies:0,types:[]});


const comoLista = (v: unknown): unknown[] => Array.isArray(v) ? v : [];

const comoObjeto = (v: unknown): Record<string, unknown> => v !== null && typeof v === 'object' && !Array.isArray(v) ? v as Record<string, unknown> : {};

/** Registra falhas de observabilidade sem alterar o resultado da operação original. */
const avisarFalhaDoDiario = (fase: string, id: string) => {
  process.stderr.write(`PRUMO_OBSERVABILITY_ERROR phase=${fase} operationId=${id}; resultado do núcleo preservado; verifique PRUMO_DATA_DIR/permissões/limites.\n`);
};

export function iniciarAtividade(p:Projeto,tool:string,origem:Origem,entrada:unknown={},opcoes:{base?:string;diagnostico?:(fase:string,id:string)=>void}={}) {
  const id=randomUUID();const inicio=performance.now();const r=comoObjeto(entrada);
  const cliente=origem.origin==='CLI'?'terminal':/sdk|test|acceptance|demonstracao|lab-avaliador|inspector/i.test(origem.client??'')?'sdk':/codex/i.test(origem.client??'')?'codex':/claude/i.test(origem.client??'')?'claude':'outro';
  const e:Omit<Evento,'level'|'digest'>={version:1,operationId:id,projectId:hash(p.manifesto.id),rootHash:hash(p.raiz),manifestHash:p.manifestoHash,
    tool:ferramentas.includes(tool as typeof ferramentas[number])?tool as typeof ferramentas[number]:'desconhecida',origin:origem.origin,client:cliente,clientIdentity:'declarada',clientClassificationVersion:2,
    phase:'start',at:new Date().toISOString(),durationMs:0,state:'STARTED',input:tool==='revisar_cobertura'?{candidates:Math.min(comoLista(r.candidates).length,1000000),existingTests:Math.min(comoLista(r.existingTests).length,1000000),hasRequirement:typeof r.requirement==='string'&&!!r.requirement.trim(),hasSource:typeof r.source==='string'&&!!r.source.trim()}:{},summary:resumoVazio()};
  const avisar=opcoes.diagnostico??avisarFalhaDoDiario;let alvo:string|undefined;let encerrado=false;
  try {
    const pasta=pastaAtividades(p,opcoes.base);
    if(arquivosDoDiario(pasta).length>=limitesHistorico.arquivos)falharCom('HISTORY_FILE_LIMIT');
    fs.mkdirSync(pasta,{recursive:true,mode:0o700});semLinks(pasta);
    alvo=path.join(pasta,id+'.jsonl');gravarNoDiario(alvo,e,true);
  } catch { alvo=undefined;avisar('start',id); }
  return {id, finalizar(resultado:unknown,erro=false) {
    if(encerrado)return;encerrado=true;
    const saida=comoObjeto(resultado);const summary=resumoVazio();const encontrados=comoLista(saida.findings);
    // Guarda só referências efetivamente devolvidas/consultadas, sem texto, título, origem privada ou aprovador.
    const referencias:Record<string,unknown>[] = tool==='contexto_projeto'
      ? comoLista(comoObjeto(saida.contextos).referencias).map(v=>({...comoObjeto(v),uso:'incluido_na_resposta'}))
      : tool==='revisar_cobertura' ? comoLista(saida.facts).filter(v=>comoObjeto(v).kind==='context_used').map(v=>({...comoObjeto(v),uso:'consultado_na_revisao'})) : [];
    const refs = referencias.map(v=>referenciaSchema.safeParse({id:v.id,versao:v.versao,hash:v.hash,estado:v.estado,uso:v.uso})).filter(v=>v.success).map(v=>v.data!);
    if(refs.length)summary.contextReferences=refs.slice(0,100);
    summary.findings=encontrados.length;
    summary.recommendations=encontrados.filter(f=>typeof comoObjeto(f).recommendation==='string'&&!!(comoObjeto(f).recommendation as string).trim()).length;
    const tipos=new Map<string,number>();
    for(const f of encontrados) { const t=comoObjeto(f).type;const tipo=typeof t==='string'&&Object.hasOwn(orientacoes,t)?t:'OTHER_FINDING';tipos.set(tipo,(tipos.get(tipo)??0)+1); }
    summary.types=[...tipos].map(([type,count])=>({type,count}));
    summary.candidateRedundancies=tipos.get('POTENTIAL_REDUNDANCY')??0;
    summary.gaps=summary.types.filter(t=>achadoELacuna(t.type)).reduce((n,t)=>n+t.count,0);
    if(z.string().uuid().safeParse(saida.jobId).success)summary.evidenceJobId=saida.jobId as string;
    if(typeof saida.persisted==='boolean')summary.evidencePersisted=saida.persisted;
    if(typeof saida.executed==='boolean')summary.executed=saida.executed;
    const codigo=typeof saida.reason==='string'?saida.reason.split(':')[0]!:typeof saida.codigo==='string'?saida.codigo:'';
    if(codigos.has(codigo))summary.code=codigo;
    if(erro)summary.code=summary.code??'TOOL_ERROR';
    const estado=saida.status??saida.state;
    const state=erro?'ERROR':typeof estado==='string'&&estados.includes(estado as typeof estados[number])&&estado!=='STARTED'?estado as Evento['state']:'OK';
    try { if(alvo)gravarNoDiario(alvo,{...e,phase:'end',at:new Date().toISOString(),durationMs:Math.round((performance.now()-inicio)*1000)/1000,state,summary},false); }
    catch { avisar('end',id); }
  }};
}
