/** Formato de uma issue e de seus eventos consultados no GitHub. */
import fs from 'node:fs';
import { z } from 'zod';

export const numeroChamado = z.number().int().min(1).max(999999999);

export const statusChamados = z.array(z.object({id:z.string(),nome:z.string(),rotulo:z.string(),cor:z.string().regex(/^[a-f0-9]{6}$/),explicacao:z.string()}).strict()).parse(JSON.parse(fs.readFileSync(new URL('../../../app/suporte-status.json',import.meta.url),'utf8')));

export const autor=z.object({login:z.string().max(100)}).nullable();

export const issueSchema=z.object({number:numeroChamado,title:z.string().max(1000),state:z.enum(['open','closed']),created_at:z.string().datetime(),updated_at:z.string().datetime(),user:autor,assignees:z.array(z.object({login:z.string().max(100)})).max(100),labels:z.array(z.object({name:z.string().max(100)})).max(100),pull_request:z.unknown().optional()});

export const eventoSchema=z.object({event:z.string().max(100),created_at:z.string().datetime(),actor:autor,label:z.object({name:z.string().max(100)}).optional()});
