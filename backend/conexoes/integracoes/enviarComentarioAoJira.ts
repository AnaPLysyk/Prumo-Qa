/** Envia só o comentário de resultado ao Jira (único caminho aceito). */
import { ErroServico } from './ErroServico.js';
import { requisitarServico } from './requisitarServico.js';
import { TransporteEscrita } from '../tipos/transporte.js';

export const enviarComentarioAoJira:TransporteEscrita=p=>{if(p.corpo.length>40000||p.servico!=='jira'||!/^\/rest\/api\/3\/issue\/[A-Z][A-Z0-9_]*-\d+\/comment$/.test(p.caminho))throw new ErroServico('SERVICE_WRITE_BLOCKED');return requisitarServico(p,'POST',p.corpo);};
