/** Envia uma escrita (POST/PUT/PATCH) ao serviço, com corpo limitado a 12 MB. */
import { ErroServico } from './ErroServico.js';
import { requisitarServico } from './requisitarServico.js';
import { TransporteEscrita } from '../tipos/transporte.js';

/** Escritas da 2.9 (Jira, Qase, GitHub): só as rotas da lista fechada em rotasEscrita.ts, corpo limitado a 12 MB, sem redirecionamento. */
export const enviarAoServico:TransporteEscrita=p=>{if(p.corpo.length>12*1024*1024)throw new ErroServico('SERVICE_WRITE_BLOCKED');return requisitarServico({...p,timeoutMs:p.timeoutMs??30000},p.metodo??'POST',p.corpo,p.tipoConteudo??'application/json');};
