/** Consultas de leitura conhecidas por serviço e o formato da configuração de um serviço. */
import { z } from 'zod';
import { operacoesExtras } from './leituras.js';
import { MetodoEscrita } from './rotasDeEscrita.js';
import { Servico } from '../../projetos/tipos/espacos.js';

export const operacoesServico=['tickets','ticket','campos','comentarios','defeitos','defeito','suites','casos','caso','planos','runs','run','resultados','repositorio','branches','commits','prs','pr','verificacoes',...operacoesExtras] as const;

export type OperacaoServico=typeof operacoesServico[number];

export type ConfigServico={id:string;servico:Servico;instancia:string;usuario?:string;contaId:string;token:string};

export const obj=z.record(z.unknown());

export const objetos=z.array(obj).max(100);

export const sid=z.union([z.string().min(1).max(200),z.number().int().safe().nonnegative()]).transform(String);

export const nome=z.string().min(1).max(1000);

export const paginaQase=z.object({status:z.literal(true),result:z.object({total:z.number().int().nonnegative(),filtered:z.number().int().nonnegative().optional(),entities:objetos})});

export const itemQase=z.object({status:z.literal(true),result:obj});

export type ContextoServico={servico:Servico;instancia:string;ler:(caminho:string)=>Promise<unknown>;enviar:(metodo:MetodoEscrita,caminho:string,corpo:string|Buffer,tipoConteudo?:string,extraHeaders?:Record<string,string>)=>Promise<unknown>;limpar:(v:unknown)=>unknown};
