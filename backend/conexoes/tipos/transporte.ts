/** Códigos de erro dos serviços, formato dos pedidos de leitura e escrita e da paginação. */
import { z } from 'zod';
import { MetodoEscrita } from './rotasDeEscrita.js';
import { Servico } from '../../projetos/tipos/espacos.js';

export const codigosServico=['CREDENTIAL_UNAVAILABLE','CREDENTIAL_INVALID_OR_EXPIRED','SERVICE_PERMISSION','SERVICE_NOT_FOUND','SERVICE_RATE_LIMIT','SERVICE_TIMEOUT','SERVICE_UNAVAILABLE','SERVICE_RESPONSE_INVALID','SERVICE_REDIRECT_BLOCKED','SERVICE_RESPONSE_LIMIT','SERVICE_DESTINATION_BLOCKED','SERVICE_WRITE_BLOCKED','SERVICE_SCOPE_CHANGED','SERVICE_DUPLICATE','SERVICE_PLAN_LIMIT'] as const;

export type PedidoServico={servico:Servico;instancia:string;caminho:string;headers:Record<string,string>;timeoutMs?:number};

export type TransporteServico=(pedido:PedidoServico)=>Promise<unknown>;

/** Pedido de escrita remota: só sai se o método e o caminho estiverem na lista fechada (rotasDeEscrita.ts); qualquer outro é recusado. */
type PedidoEscrita=PedidoServico&{corpo:string|Buffer;metodo?:MetodoEscrita;tipoConteudo?:string};

export type TransporteEscrita=(pedido:PedidoEscrita)=>Promise<unknown>;

export const paginaSchema=z.object({offset:z.number().int().min(0).max(100000).default(0),cursor:z.string().max(2000).optional(),limite:z.number().int().min(1).max(100).default(50)}).strict();
